import { useEffect, useState } from "react";
import { getTaskStatus } from "../services/taskService";
import "./TaskProgressModal.css";

export default function TaskProgressModal({
  taskId,
  title = "Background Task",
  description = "Processing task in background...",
  actionLabel = null,
  onAction = null,
  onClose,
  onComplete,
}) {
  const [task, setTask] = useState({
    status: "PENDING",
    percent: 0,
    current: 0,
    total: 100,
    message: "Initializing background worker...",
    result: null,
    error: null,
  });

  useEffect(() => {
    if (!taskId) return;

    let isSubscribed = true;
    let timer = null;

    const pollStatus = async () => {
      try {
        const data = await getTaskStatus(taskId);
        if (!isSubscribed) return;

        setTask(data);

        if (data.status === "SUCCESS") {
          if (onComplete) onComplete(data.result);
          return;
        }

        if (data.status === "FAILURE") {
          return;
        }

        // Continue polling every 600ms
        timer = setTimeout(pollStatus, 600);
      } catch (err) {
        console.error("Task polling error:", err);
        if (isSubscribed) {
          timer = setTimeout(pollStatus, 1200);
        }
      }
    };

    pollStatus();

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
    };
  }, [taskId, onComplete]);

  const percent = Math.min(100, Math.max(0, task.percent || 0));
  const isFinished = task.status === "SUCCESS";
  const isFailed = task.status === "FAILURE";

  return (
    <div className="task-modal-backdrop" role="dialog" aria-modal="true">
      <div className="task-modal-card">
        {/* HEADER */}
        <div className="task-modal-header">
          <div className="task-modal-title-wrap">
            <span className="task-modal-icon">
              {isFinished ? "✓" : isFailed ? "✕" : "⚙"}
            </span>
            <div>
              <h3>{title}</h3>
              <p className="task-modal-subtitle">{description}</p>
            </div>
          </div>
          {(isFinished || isFailed) && (
            <button
              type="button"
              className="task-modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          )}
        </div>

        {/* PROGRESS BAR */}
        <div className="task-modal-body">
          <div className="task-progress-wrap">
            <div className="task-progress-bar-bg">
              <div
                className={`task-progress-bar-fill ${
                  isFinished ? "is-success" : isFailed ? "is-error" : ""
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="task-progress-stats">
              <span className="task-progress-message">
                {task.message || (isFinished ? "Completed" : "Processing...")}
              </span>
              <span className="task-progress-percent">{percent}%</span>
            </div>
          </div>

          {/* TASK DETAILS / RESULT */}
          {task.status === "PROGRESS" && task.total > 0 && (
            <p className="task-progress-counts">
              Step {task.current} of {task.total} completed
            </p>
          )}

          {isFinished && task.result && (
            <div className="task-success-box">
              <p className="task-success-message">
                ✓ {task.message || "Task completed successfully!"}
              </p>
              {task.result.total_imported !== undefined && (
                <p className="task-detail-line">
                  Imported: <strong>{task.result.total_imported}</strong> products
                </p>
              )}
            </div>
          )}

          {isFailed && (
            <div className="task-error-box">
              <p className="task-error-message">
                ✕ {task.error || "An error occurred during task execution."}
              </p>
            </div>
          )}

          <div className="task-meta-id">
            <small>Task ID: <code>{taskId}</code></small>
            <span className={`task-badge task-badge-${task.status.toLowerCase()}`}>
              {task.status}
            </span>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="task-modal-footer">
          {isFinished && actionLabel && onAction && (
            <button
              type="button"
              className="task-action-btn primary"
              onClick={() => onAction(task.result)}
            >
              {actionLabel}
            </button>
          )}

          <button
            type="button"
            className="task-action-btn secondary"
            onClick={onClose}
          >
            {isFinished ? "Done" : isFailed ? "Close" : "Run in Background"}
          </button>
        </div>
      </div>
    </div>
  );
}

