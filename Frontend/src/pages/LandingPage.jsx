import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { FeatureCard } from "../components/FeatureCard";
import { Footer } from "../components/Footer";
import { AuthModal } from "../components/AuthModal";
import { Link } from "wouter";
import { Users, Lock, ClipboardList, FileSearch, Activity, LineChart, CheckCircle2 } from "lucide-react";
import ToastBanner from "../components/dashboard/ToastBanner";

export default function LandingPage({ initialAuthTab = "login", initialAuthOpen = false }) {
  const [isModalOpen, setIsModalOpen] = useState(initialAuthOpen);
  const [activeTab, setActiveTab] = useState(initialAuthTab);
  const [flashToast, setFlashToast] = useState({ message: "", tone: "success" });

  useEffect(() => {
    const rawToast = sessionStorage.getItem("teamsync:flash-toast");
    if (!rawToast) {
      return;
    }

    sessionStorage.removeItem("teamsync:flash-toast");

    try {
      const parsed = JSON.parse(rawToast);
      if (parsed?.message) {
        setFlashToast({
          message: parsed.message,
          tone: parsed.tone === "error" ? "error" : "success",
        });
      }
    } catch {
      setFlashToast({ message: rawToast, tone: "success" });
    }
  }, []);

  useEffect(() => {
    if (!flashToast.message) {
      return;
    }

    const timerId = setTimeout(() => {
      setFlashToast({ message: "", tone: "success" });
    }, 3000);

    return () => clearTimeout(timerId);
  }, [flashToast.message]);

  const openLogin = () => { setActiveTab("login"); setIsModalOpen(true); };
  const openRegister = () => { setActiveTab("register"); setIsModalOpen(true); };
  const features = [
    {
      icon: Users,
      title: "Multi-Tenant Team Management",
      description: "Organize departments, projects, or external clients in isolated workspaces with their own settings and data."
    },
    {
      icon: Lock,
      title: "Role-Based Access Control",
      description: "Granular permissions ensure team members only see and modify what they are authorized to access."
    },
    {
      icon: ClipboardList,
      title: "Task Assignment & Tracking",
      description: "Assign responsibilities clearly, set deadlines, and track progress through customizable workflows."
    },
    {
      icon: FileSearch,
      title: "Audit Logs & Transparency",
      description: "Immutable history of all actions. Know exactly who changed what and when for perfect accountability."
    },
    {
      icon: Activity,
      title: "Real-Time Status Updates",
      description: "Live notifications and board updates keep everyone on the same page without unnecessary meetings."
    },
    {
      icon: LineChart,
      title: "Productivity Insights",
      description: "Visual dashboards show team velocity, bottleneck identification, and workload distribution at a glance."
    }
  ];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      <ToastBanner message={flashToast.message} tone={flashToast.tone} />
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={activeTab}
      />
      <Navbar onLoginClick={openLogin} onGetStartedClick={openRegister} />
      <main>
        <Hero onGetStartedClick={openRegister} onLoginClick={openLogin} />

        {/* Features Section */}
        <section id="features" className="py-24 bg-gray-50/50">
          <div className="container mx-auto px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything your team needs</h2>
              <p className="text-lg text-muted-foreground">
                Powerful tools designed to create transparency, enforce accountability, and drive massive productivity gains.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="benefits" className="py-24">
          <div className="container mx-auto px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Why modern teams choose <span className="text-primary">TeamSync</span>
                </h2>
                <div className="space-y-6">
                  {[
                    { title: "Better collaboration", desc: "Break down silos with shared visibility into cross-functional goals." },
                    { title: "Clear accountability", desc: "No more 'I thought you were doing that'. Ownership is always explicit." },
                    { title: "Organized workflow", desc: "Standardize processes across the organization with customizable templates." },
                    { title: "Secure environment", desc: "Enterprise-grade security keeps your proprietary data safe and compliant." }
                  ].map((benefit, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{benefit.title}</h4>
                        <p className="text-muted-foreground">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-3xl p-8 lg:p-12 border border-border">
                <div className="space-y-6">
                  {/* Abstract UI representation */}
                  <div className="h-12 w-full bg-white rounded-lg border border-border shadow-sm flex items-center px-4">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="ml-auto flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-primary/20"></div>
                      <div className="h-6 w-6 rounded-full bg-blue-200"></div>
                    </div>
                  </div>
                  <div className="h-32 w-full bg-white rounded-lg border border-border shadow-sm p-4 space-y-3">
                    <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                    <div className="h-4 w-full bg-gray-100 rounded"></div>
                    <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-white rounded-lg border border-border shadow-sm p-4">
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 w-12 bg-primary/20 rounded"></div>
                    </div>
                    <div className="h-24 bg-white rounded-lg border border-border shadow-sm p-4">
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 w-12 bg-green-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-gray-50/80 border-y border-border/50">
          <div className="container mx-auto px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-lg text-muted-foreground">
                Get up and running in minutes, not months.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border z-0"></div>
              
              {[
                { step: "01", title: "Create or Join a Team", desc: "Set up your workspace and invite members via email or SSO." },
                { step: "02", title: "Assign and Track Tasks", desc: "Create tasks, assign owners, and watch progress flow through the board." },
                { step: "03", title: "Monitor Progress", desc: "Use dashboards and audit logs to ensure accountability and speed." }
              ].map((item, index) => (
                <div key={index} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-white border-4 border-primary/20 text-primary font-bold text-2xl rounded-full flex items-center justify-center mb-6 shadow-sm">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call To Action Section */}
        <section className="py-24">
          <div className="container mx-auto px-8">
            <div className="bg-primary rounded-[2.5rem] p-10 md:p-16 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to transform your team?</h2>
                <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 font-medium">
                  Join thousands of companies using TeamSync to get work done right.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={openRegister}
                    className="bg-white text-primary hover:bg-gray-100 h-14 px-8 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center cursor-pointer"
                  >
                    Get Started for Free
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
