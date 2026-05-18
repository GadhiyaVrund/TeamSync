import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "../components/dashboard/Sidebar";
import Header from "../components/dashboard/Header";
import KanbanBoard from "../components/dashboard/KanbanBoard";
import NewTaskModal from "../components/dashboard/NewTaskModal";
import CreateTeamModal from "../components/dashboard/CreateTeamModal";
import ManagerProfileModal from "../components/dashboard/ManagerProfileModal";
import ToastBanner from "../components/dashboard/ToastBanner";
import DashboardHome from "../components/dashboard/home/DashboardHome";
import { getUserTeams, getTeamById, createTeam as createTeamAPI } from "../apis/team.api";
import { getCurrentUser, logoutUser } from "../apis/auth.api";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [activeTab, setActiveTab] = useState("home");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", tone: "success" });
  const toastTimerRef = useRef(null);

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(true);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message, tone = "success") => {
    setToast({ message, tone });

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast({ message: "", tone: "success" });
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleProfileUpdated = (updatedUser) => {
    if (!updatedUser) {
      return;
    }

    setCurrentUser((previous) => ({ ...previous, ...updatedUser }));
  };

  const handleLogout = async ({ skipRequest = false, redirectTo = "/login", flashMessage = "Signed out successfully." } = {}) => {
    if (!skipRequest) {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Logout request failed:", error);
      }
    }

    setCurrentUser(null);
    setProfileOpen(false);

    if (flashMessage) {
      sessionStorage.setItem(
        "teamsync:flash-toast",
        JSON.stringify({ message: flashMessage, tone: "success" })
      );
    }

    navigate(redirectTo);
  };

  const handleSelectNav = (navId) => {
    setActiveNav(navId);

    if (navId === "home") {
      setActiveTab("home");
      return;
    }

    if (navId === "my-tasks") {
      setActiveTab("my-tasks");
      return;
    }

    if (navId === "sprint") {
      setActiveTab("sprint");
      return;
    }

    setActiveTab("company");
  };

  const handleHeaderTabChange = (tabId) => {
    setActiveTab(tabId);

    if (tabId === "home") {
      setActiveNav("home");
      return;
    }

    if (tabId === "my-tasks") {
      setActiveNav("my-tasks");
      return;
    }

    if (tabId === "sprint") {
      setActiveNav("sprint");
      return;
    }

    if (selectedTeamId) {
      setActiveNav(`team:${selectedTeamId}`);
      return;
    }

    setActiveNav("home");
  };

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
    if (!teamId) {
      return;
    }

    setActiveNav(`team:${teamId}`);
    setActiveTab("company");

    if (teamId === selectedTeamId) {
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
    setActiveNav(`team:${newTeam._id}`);
    setActiveTab("company");
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
        onSelectNav={handleSelectNav}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={handleSelectTeam}
        onCreateTeam={() => setCreateTeamOpen(true)}
        currentUser={currentUser}
        teamsLoading={teamsLoading}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          activeTab={activeTab}
          setActiveTab={handleHeaderTabChange}
          currentUser={currentUser}
          onOpenProfile={() => setProfileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {activeNav === "home" ? (
            <DashboardHome
              currentUser={currentUser}
              activeTeams={teams.length}
            />
          ) : (
            <KanbanBoard
              activeTab={activeTab}
              selectedTeam={selectedTeam}
              currentUser={currentUser}
              onNewTask={() => setNewTaskOpen(true)}
              loading={teamLoading}
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

      <ManagerProfileModal
        isOpen={profileOpen}
        currentUser={currentUser}
        onClose={() => setProfileOpen(false)}
        onProfileUpdated={handleProfileUpdated}
        onLogout={handleLogout}
        onToast={showToast}
      />

      <ToastBanner message={toast.message} tone={toast.tone} />
    </div>
  );
}


