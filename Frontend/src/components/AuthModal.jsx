import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckSquare, X, Eye, EyeOff, ArrowLeft, ArrowRight, Building2, Users } from "lucide-react";
import { loginUser, registerUser, createOrganization, joinOrganization } from "../apis/auth.api";
import ToastBanner from "./dashboard/ToastBanner";

export function AuthModal({ isOpen, onClose, defaultTab = "login" }) {
  // view: "login" | "register" | "createOrg" | "joinOrg"
  const [view, setView] = useState(defaultTab === "register" ? "register" : "login");
  const [, navigate] = useLocation();

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    mobileNo: "",
    password: "",
    confirmPassword: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerStep, setRegisterStep] = useState(1); // 1 = fields, 2 = org chooser

  // Create Org state
  const [orgName, setOrgName] = useState("");
  const [createOrgLoading, setCreateOrgLoading] = useState(false);

  // Join Org state
  const [joinData, setJoinData] = useState({ organizationName: "", joinCode: "" });
  const [joinOrgLoading, setJoinOrgLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: "", tone: "error" });

  const showToast = (message, tone = "error") => {
    setToast({ message, tone });
  };

  // Auto-clear toast
  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => setToast({ message: "", tone: "error" }), 4000);
    return () => clearTimeout(timer);
  }, [toast.message]);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setView(defaultTab === "register" ? "register" : "login");
      setLoginData({ email: "", password: "" });
      setRegisterData({ username: "", email: "", mobileNo: "", password: "", confirmPassword: "" });
      setOrgName("");
      setJoinData({ organizationName: "", joinCode: "" });
      setIsRegistered(false);
      setRegisterStep(1);
      setShowPassword(false);
      setToast({ message: "", tone: "error" });
    }
  }, [isOpen, defaultTab]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLoading = loginLoading || registerLoading || createOrgLoading || joinOrgLoading;

  /* ── Validation helpers ── */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateRegisterFields = () => {
    const { username, email, mobileNo, password, confirmPassword } = registerData;
    if (!username.trim() || !email.trim() || !mobileNo.trim() || !password || !confirmPassword) {
      showToast("All fields are required");
      return false;
    }
    if (!validateEmail(email)) {
      showToast("Please enter a valid email address");
      return false;
    }
    if (password.length < 8) {
      showToast("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match");
      return false;
    }
    return true;
  };

  /* ── Handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!loginData.email.trim() || !loginData.password) {
      showToast("Email and password are required");
      return;
    }
    setLoginLoading(true);
    try {
      await loginUser(loginData);
      onClose();
      navigate("/app");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const doRegister = async () => {
    if (isRegistered) return true;
    setRegisterLoading(true);
    try {
      await registerUser({
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        mobileNo: registerData.mobileNo.trim(),
        password: registerData.password,
      });
      setIsRegistered(true);
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Registration failed");
      return false;
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleNext = async () => {
    if (isLoading) return;
    if (!validateRegisterFields()) return;
    const ok = await doRegister();
    if (ok) setRegisterStep(2);
  };

  const handleChooseCreateOrg = () => {
    if (isLoading) return;
    setView("createOrg");
  };

  const handleChooseJoinOrg = () => {
    if (isLoading) return;
    setView("joinOrg");
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!orgName.trim()) {
      showToast("Organization name is required");
      return;
    }
    setCreateOrgLoading(true);
    try {
      await createOrganization({ name: orgName.trim() });
      onClose();
      navigate("/app");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to create organization");
    } finally {
      setCreateOrgLoading(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    if (!joinData.organizationName.trim() || !joinData.joinCode.trim()) {
      showToast("Organization name and join code are required");
      return;
    }
    setJoinOrgLoading(true);
    try {
      await joinOrganization({
        organizationName: joinData.organizationName.trim(),
        joinCode: joinData.joinCode.trim(),
      });
      onClose();
      navigate("/app");
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Failed to join organization");
    } finally {
      setJoinOrgLoading(false);
    }
  };

  /* ── Shared styles ── */
  const inputClass =
    "w-full px-3 py-2.5 border border-border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors";
  const btnPrimary =
    "w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";

  /* ── View titles ── */
  const titles = {
    login: "Sign In",
    register: "Create Account",
    createOrg: "Create Organization",
    joinOrg: "Join Organization",
  };

  const showBackButton = view === "createOrg" || view === "joinOrg";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Toast relative to viewport */}
      <ToastBanner message={toast.message} tone={toast.tone} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <button
                onClick={() => setView("register")}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors mr-1"
                aria-label="Go back"
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
            )}
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <CheckSquare className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">TeamSync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Switcher — only show on login/register views */}
        {(view === "login" || view === "register") && (
          <div className="flex mx-6 mt-4 mb-5 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => { if (!isLoading) { setView("login"); setToast({ message: "", tone: "error" }); } }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === "login"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { if (!isLoading) { setView("register"); setToast({ message: "", tone: "error" }); } }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${view === "register"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Step title for org views */}
        {(view === "createOrg" || view === "joinOrg") && (
          <div className="px-6 mt-4 mb-5">
            <h2 className="text-lg font-semibold text-foreground">{titles[view]}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {view === "createOrg"
                ? "Set up a new organization for your team."
                : "Enter the details to join an existing organization."}
            </p>
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {loginLoading ? "Signing in…" : "Sign in"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setView("register")}
                className="text-primary font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {view === "register" && (
          <div className="px-6 pb-6 space-y-4">
            {/* ── Step 1: User details ── */}
            {registerStep === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="johndoe"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="1234567890"
                    value={registerData.mobileNo}
                    onChange={(e) => setRegisterData({ ...registerData, mobileNo: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Min 8 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className={`${inputClass} pr-10`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className={`${btnPrimary} flex items-center justify-center gap-2`}
                >
                  {registerLoading ? "Creating account…" : (<>Next <ArrowRight className="h-4 w-4" /></>)}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}

            {/* ── Step 2: Organization chooser ── */}
            {registerStep === 2 && (
              <>
                <div className="text-center space-y-1 pb-2">
                  <h3 className="text-lg font-semibold text-foreground">Choose your organization</h3>
                  <p className="text-sm text-muted-foreground">Create a new organization or join an existing one.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleChooseCreateOrg}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-foreground">Create Organization</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleChooseJoinOrg}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Users className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium text-foreground">Join Organization</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setRegisterStep(1)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </>
            )}
          </div>
        )}

        {/* ── CREATE ORG FORM ── */}
        {view === "createOrg" && (
          <form onSubmit={handleCreateOrg} className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization name
              </label>
              <input
                type="text"
                required
                placeholder="Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {createOrgLoading ? "Creating…" : "Create Organization"}
            </button>
          </form>
        )}

        {/* ── JOIN ORG FORM ── */}
        {view === "joinOrg" && (
          <form onSubmit={handleJoinOrg} className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization name
              </label>
              <input
                type="text"
                required
                placeholder="Acme Corp"
                value={joinData.organizationName}
                onChange={(e) => setJoinData({ ...joinData, organizationName: e.target.value })}
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join code
              </label>
              <input
                type="text"
                required
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={joinData.joinCode}
                onChange={(e) => setJoinData({ ...joinData, joinCode: e.target.value })}
                className={inputClass}
              />
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {joinOrgLoading ? "Joining…" : "Join Organization"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}