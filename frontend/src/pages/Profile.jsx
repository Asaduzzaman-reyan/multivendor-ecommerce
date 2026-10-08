import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();

  return (
    <section className="content-card">
      <h1>Your profile</h1>
      <dl className="profile-list">
        <dt>Name</dt><dd>{user.name}</dd>
        <dt>Email</dt><dd>{user.email}</dd>
        <dt>Phone</dt><dd>{user.phone}</dd>
        <dt>Address</dt><dd>{user.address}</dd>
        <dt>Role</dt><dd>{user.role}</dd>
        {user.vendor && <><dt>Store</dt><dd>{user.vendor.storeName} ({user.vendor.status})</dd></>}
      </dl>
    </section>
  );
}

export default Profile;
