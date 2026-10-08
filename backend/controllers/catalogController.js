const { getDatabase } = require('../config/database');

const resources = {
  categories: {
    table: 'categories',
    fields: ['name', 'description', 'image'],
    select: 'id, name, description, image, created_at AS createdAt',
  },
  brands: {
    table: 'brands',
    fields: ['name', 'logo', 'description'],
    select: 'id, name, logo, description, created_at AS createdAt',
  },
};

function singularName(resourceName) {
  return resourceName === 'categories' ? 'category' : 'brand';
}

function getResource(resourceName) {
  const resource = resources[resourceName];
  if (!resource) {
    const error = new Error('Catalog resource not found');
    error.statusCode = 404;
    throw error;
  }
  return resource;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validatePayload(resourceName, body) {
  const name = text(body.name);
  if (!name) {
    const error = new Error(`${resourceName === 'categories' ? 'Category' : 'Brand'} name is required`);
    error.statusCode = 400;
    throw error;
  }
  if (name.length > 120) {
    const error = new Error('Name must be 120 characters or fewer');
    error.statusCode = 400;
    throw error;
  }

  if (resourceName === 'categories') {
    return [name, text(body.description), text(body.image) || null];
  }
  return [name, text(body.logo) || null, text(body.description)];
}

function list(resourceName) {
  const resource = getResource(resourceName);
  return (_req, res, next) => {
    try {
      const items = getDatabase()
        .prepare(`SELECT ${resource.select} FROM ${resource.table} ORDER BY name COLLATE NOCASE ASC`)
        .all();
      res.json({ [resourceName]: items });
    } catch (error) {
      next(error);
    }
  };
}

function create(resourceName) {
  const resource = getResource(resourceName);
  return (req, res, next) => {
    try {
      const values = validatePayload(resourceName, req.body);
      const placeholders = values.map(() => '?').join(', ');
      const columns = resource.fields.join(', ');
      const result = getDatabase()
        .prepare(`INSERT INTO ${resource.table} (${columns}) VALUES (${placeholders})`)
        .run(...values);
      const item = getDatabase()
        .prepare(`SELECT ${resource.select} FROM ${resource.table} WHERE id = ?`)
        .get(Number(result.lastInsertRowid));
      res.status(201).json({ [singularName(resourceName)]: item });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error.statusCode = 409;
        error.message = 'An item with this name already exists';
      }
      next(error);
    }
  };
}

function update(resourceName) {
  const resource = getResource(resourceName);
  return (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        const error = new Error('A valid catalog item id is required');
        error.statusCode = 400;
        throw error;
      }
      const values = validatePayload(resourceName, req.body);
      const assignments = resource.fields.map((field) => `${field} = ?`).join(', ');
      const result = getDatabase()
        .prepare(`UPDATE ${resource.table} SET ${assignments} WHERE id = ?`)
        .run(...values, id);
      if (result.changes === 0) {
        const error = new Error('Catalog item not found');
        error.statusCode = 404;
        throw error;
      }
      const item = getDatabase()
        .prepare(`SELECT ${resource.select} FROM ${resource.table} WHERE id = ?`)
        .get(id);
      res.json({ [singularName(resourceName)]: item });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error.statusCode = 409;
        error.message = 'An item with this name already exists';
      }
      next(error);
    }
  };
}

function remove(resourceName) {
  const resource = getResource(resourceName);
  return (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id < 1) {
        const error = new Error('A valid catalog item id is required');
        error.statusCode = 400;
        throw error;
      }
      const result = getDatabase()
        .prepare(`DELETE FROM ${resource.table} WHERE id = ?`)
        .run(id);
      if (result.changes === 0) {
        const error = new Error('Catalog item not found');
        error.statusCode = 404;
        throw error;
      }
      res.status(204).send();
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        error.statusCode = 409;
        error.message = 'This item is in use and cannot be deleted';
      }
      next(error);
    }
  };
}

module.exports = {
  list,
  create,
  update,
  remove,
};
