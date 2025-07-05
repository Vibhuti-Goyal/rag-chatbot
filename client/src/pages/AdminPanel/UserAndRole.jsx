import React, { useEffect, useState } from 'react';
import { SummaryApi } from '../../common';
import styles from './styles/UserAndRole.module.scss';
const departments = ['sales', 'hr', 'engineering', 'finance', 'legal', 'admin'];
const roles = ['user', 'admin'];

const UserAndRole = () => {
    const [users, setUsers] = useState([]);
    const [editState, setEditState] = useState({});
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await fetch(SummaryApi.FetchAllUser.url, {
                method: SummaryApi.FetchAllUser.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data.data);
                const initEdit = {};
                data.data.forEach(user => {
                    initEdit[user._id] = {
                        department: user.department,
                        role: user.role,
                    };
                });
                setEditState(initEdit);
            } else {
                setError(data.message || 'Failed to fetch users');
            }
        } catch (err) {
            setError('Error fetching users');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleChange = (userId, field, value) => {
        setEditState(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (userId) => {
        const updated = editState[userId];
        console.log('Updating user:', userId, updated);
        try {
            const res = await fetch(SummaryApi.UpdateUser.url, {
                method: SummaryApi.UpdateUser.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    userId,
                    role: updated.role,
                    department: updated.department,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('User updated successfully');
                fetchUsers(); // refresh after update
            } else {
                alert(data.message || 'Failed to update user');
            }
        } catch (err) {
            alert('Network error');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Manage Users and Roles</h2>
                <div className={styles.subtitle}>
                    Update user departments and roles across your organization
                </div>
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {Array.isArray(users) && users.length > 0 ? (
                <div className={styles.tableContainer}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead className={styles.tableHead}>
                                <tr>
                                    <th className={styles.th}>
                                        <span className={styles.headerContent}>
                                            <span className={styles.headerIcon}>👤</span>
                                            Name
                                        </span>
                                    </th>
                                    <th className={styles.th}>
                                        <span className={styles.headerContent}>
                                            <span className={styles.headerIcon}>📧</span>
                                            Email
                                        </span>
                                    </th>
                                    <th className={styles.th}>
                                        <span className={styles.headerContent}>
                                            <span className={styles.headerIcon}>🏢</span>
                                            Department
                                        </span>
                                    </th>
                                    <th className={styles.th}>
                                        <span className={styles.headerContent}>
                                            <span className={styles.headerIcon}>🎭</span>
                                            Role
                                        </span>
                                    </th>
                                    <th className={styles.th}>
                                        <span className={styles.headerContent}>
                                            <span className={styles.headerIcon}>⚡</span>
                                            Actions
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={styles.tableBody}>
                                {users.map((user, index) => (
                                    <tr key={user._id} className={styles.tableRow} style={{ animationDelay: `${index * 0.1}s` }}>
                                        <td className={styles.td}>
                                            <div className={styles.userInfo}>
                                                <div className={styles.avatar}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={styles.userName}>{user.name}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={styles.email}>{user.email}</span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.selectWrapper}>
                                                <select
                                                    className={styles.select}
                                                    value={editState[user._id]?.department || ''}
                                                    onChange={(e) =>
                                                        handleChange(user._id, 'department', e.target.value)
                                                    }
                                                >
                                                    {departments.map((dept) => (
                                                        <option key={dept} value={dept}>
                                                            {dept}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className={styles.selectIcon}>▼</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.selectWrapper}>
                                                <select
                                                    className={styles.select}
                                                    value={editState[user._id]?.role || ''}
                                                    onChange={(e) =>
                                                        handleChange(user._id, 'role', e.target.value)
                                                    }
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r}
                                                        </option>
                                                    ))}
                                                </select>
                                                <span className={styles.selectIcon}>▼</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <button
                                                className={styles.saveButton}
                                                onClick={() => handleUpdate(user._id)}
                                            >
                                                <span className={styles.buttonIcon}>💾</span>
                                                Save
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>👥</div>
                    <h3 className={styles.emptyTitle}>No Users Found</h3>
                    <p className={styles.emptyDescription}>
                        There are currently no users in the system. Users will appear here once they are added.
                    </p>
                </div>
            )}
        </div>
    );
};

export default UserAndRole;
