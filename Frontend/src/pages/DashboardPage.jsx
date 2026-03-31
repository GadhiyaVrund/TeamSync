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
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setTeamsLoading(true);
      setTeamLoading(true);

      try {
        const [teamsRes, userRes] = await Promise.all([
          getUserTeams(),
          getCurrentUser(),
        ]);
        const fetchedTeams = teamsRes.data.data;

        if (!isMounted) {
          return;
        }

        setTeams(Array.isArray(fetchedTeams) ? fetchedTeams : []);
        setCurrentUser(userRes.data.data);
        setTeamsLoading(false);

        if (fetchedTeams.length > 0) {
          const initialTeamId = fetchedTeams[0]._id;
          setSelectedTeamId(initialTeamId);
          const teamRes = await getTeamById(initialTeamId);

          if (isMounted) {
            setSelectedTeam(teamRes.data.data);
          }
        } else {
          setSelectedTeam(null);
        }
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        if (isMounted) {
          setTeamsLoading(false);
          setTeamLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTeam = async (teamId) => {
    if (!teamId || teamId === selectedTeamId) {
      return;
    }

    const previousTeamId = selectedTeamId;
    setSelectedTeamId(teamId);
    setTeamLoading(true);

    try {
      const res = await getTeamById(teamId);
      setSelectedTeam(res.data.data);
    } catch (err) {
      console.error("Failed to fetch team:", err);
      setSelectedTeamId(previousTeamId ?? null);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleCreateTeam = async (teamData) => {
    const res = await createTeamAPI(teamData);
    const newTeam = res.data.data;
    setTeams((prev) => [newTeam, ...prev]);
    setSelectedTeamId(newTeam._id);
    setTeamLoading(true);

    try {
      const fullRes = await getTeamById(newTeam._id);
      setSelectedTeam(fullRes.data.data);
    } finally {
      setTeamLoading(false);
    }
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
        selectedTeamId={selectedTeamId}
        onSelectTeam={handleSelectTeam}
        onCreateTeam={() => setCreateTeamOpen(true)}
        currentUser={currentUser}
        teamsLoading={teamsLoading}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <KanbanBoard
            activeTab={activeTab}
            selectedTeam={selectedTeam}
            currentUser={currentUser}
            onNewTask={() => setNewTaskOpen(true)}
            loading={teamLoading}
          />
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


