import "./NotificationPanel.css";

function NotificationPanel({ notifications = [], onClear }) {
  return (
    <section className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>

        <button type="button" onClick={onClear}>
          Clear all
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="notification-empty">
          No notifications yet.
        </p>
      ) : (
        <ul className="notification-list">
          {notifications.map((item, index) => (
            <li
              key={item.id ?? index}
              className="notification-item"
            >
              <span className="notification-dot" />

              <div>
                <p>{item.message}</p>
                <small>{item.time ?? "Just now"}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default NotificationPanel;