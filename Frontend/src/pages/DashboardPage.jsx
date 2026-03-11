import { useState, useEffect } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import KanbanBoard from "../components/dashboard/KanbanBoard";
import NewTaskModal from "../components/dashboard/NewTaskModal";
import CreateTeamModal from "../components/dashboard/CreateTeamModal";
import { getUserTeams, getTeamById, createTeam as createTeamAPI } from "../apis/team.api";
import { getCurrentUser } from "../apis/auth.api";

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("sprint");
  const [activeTab, setActiveTab] = useState("company");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [teamsRes, userRes] = await Promise.all([
          getUserTeams(),
          getCurrentUser(),
        ]);
        const fetchedTeams = teamsRes.data.data;
        setTeams(fetchedTeams);
        setCurrentUser(userRes.data.data);
        if (fetchedTeams.length > 0) {
          const teamRes = await getTeamById(fetchedTeams[0]._id);
          setSelectedTeam(teamRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectTeam = async (teamId) => {
    try {
      const res = await getTeamById(teamId);
      setSelectedTeam(res.data.data);
    } catch (err) {
      console.error("Failed to fetch team:", err);
    }
  };

  const handleCreateTeam = async (teamData) => {
    const res = await createTeamAPI(teamData);
    const newTeam = res.data.data;
    setTeams((prev) => [newTeam, ...prev]);
    const fullRes = await getTeamById(newTeam._id);
    setSelectedTeam(fullRes.data.data);
  };

  const handleTaskCreated = (newTask) => {
    setSelectedTeam((prev) =>
      prev ? { ...prev, tasks: [newTask, ...(prev.tasks || [])] } : prev
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        teams={teams}
        selectedTeamId={selectedTeam?._id}
        onSelectTeam={handleSelectTeam}
        onCreateTeam={() => setCreateTeamOpen(true)}
        currentUser={currentUser}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading…
            </div>
          ) : (
            <KanbanBoard
              activeTab={activeTab}
              selectedTeam={selectedTeam}
              onNewTask={() => setNewTaskOpen(true)}
            />
          )}
        </main>
      </div>

      {newTaskOpen && (
        <NewTaskModal
          onClose={() => setNewTaskOpen(false)}
          selectedTeam={selectedTeam}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {createTeamOpen && (
        <CreateTeamModal
          onClose={() => setCreateTeamOpen(false)}
          onCreated={handleCreateTeam}
        />
      )}
    </div>
  );
}


