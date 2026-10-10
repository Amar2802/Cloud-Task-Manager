
import { useCallback, useEffect, useState } from "react";
import {
  Cloud, Server, CheckCircle, AlertCircle,
  Plus, Trash2, RefreshCw
} from "lucide-react";
import "./App.css";

const API_URL = "";

function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setError("");
      const response = await fetch(`${API_URL}/api/tasks`);

      if (!response.ok) throw new Error("Unable to fetch tasks");

      const data = await response.json();
      setTasks(data);
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
      setError("Could not connect to the task API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function createTask(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setTitle("");
      setDescription("");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleTask(task) {
    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${task._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !task.completed })
        }
      );

      if (!response.ok) throw new Error("Failed to update task");

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete task");

      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="brand">
          <Cloud size={28} />
          <span>CloudTask</span>
        </div>
        <span className="environment">CLOUD COMPUTING PROJECT</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Plan your work.<br />Track your progress.</h1>
        <p className="subtitle">
          A MERN task manager we're building into a cloud-native application.
        </p>
      </section>

      <section className="cards">
        <article className="card">
          <Server size={24} />
          <h2>Backend API</h2>
          <p>Express.js + MongoDB</p>
          <div className={`status ${apiStatus}`}>
            {apiStatus === "online" ? (
              <CheckCircle size={17} />
            ) : apiStatus === "offline" ? (
              <AlertCircle size={17} />
            ) : null}
            {apiStatus === "online" ? "Connected" :
              apiStatus === "offline" ? "Disconnected" : "Checking..."}
          </div>
        </article>

        <article className="card">
          <CheckCircle size={24} />
          <h2>Task progress</h2>
          <p>{completedCount} of {tasks.length} tasks completed</p>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${tasks.length
                  ? (completedCount / tasks.length) * 100
                  : 0}%`
              }}
            />
          </div>
        </article>
      </section>

      <section className="task-panel">
        <div className="section-heading">
          <div>
            <h2>My tasks</h2>
            <p>Create and manage your work</p>
          </div>
          <button className="refresh-btn" onClick={loadTasks} type="button">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <form className="task-form" onSubmit={createTask}>
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            maxLength={150}
            required
          />
          <input
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Description (optional)"
            maxLength={1000}
          />
          <button className="add-btn" type="submit">
            <Plus size={18} /> Add task
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p className="empty-state">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">
            No tasks yet. Add your first task above.
          </p>
        ) : (
          <div className="task-list">
            {tasks.map(task => (
              <article className="task-item" key={task._id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                  aria-label={`Mark ${task.title} as ${
                    task.completed ? "incomplete" : "complete"
                  }`}
                />
                <div className="task-content">
                  <h3 className={task.completed ? "completed" : ""}>
                    {task.title}
                  </h3>
                  {task.description && <p>{task.description}</p>}
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task._id)}
                  type="button"
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer>CloudTask · React · Express · MongoDB · Kubernetes</footer>
    </main>
  );
}

export default App;
