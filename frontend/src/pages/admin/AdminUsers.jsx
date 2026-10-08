import { useEffect, useState } from 'react';

import { fetchAdminUsers } from '../../api/adminApi';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetchAdminUsers().then(setUsers).catch(() => {}); }, []);
  return <section className="content-card wide-card"><h1>Users</h1>{users.map((user) => <article className="order-card" key={user.id}><strong>{user.name}</strong><p>{user.email} · {user.role} · {user.isActive ? 'Active' : 'Disabled'}</p></article>)}</section>;
}

export default AdminUsers;
