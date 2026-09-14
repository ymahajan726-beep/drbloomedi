"use client";

import React, { useState } from "react";
import Link from "next/link";
import { queueToast, useToast } from "@/components/Toast";

const BACKEND_URL = "https://drbloomedi-backend.onrender.com";

export default function LoginPage() {
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      const loginEndpoint = `${BACKEND_URL}/auth/login`;

      const res = await fetch(loginEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        throw new Error(
          errData.message ||
            `Authentication failed with status ${res.status}`
        );
      }

      const data = await res.json();

      const userRole = (
        data.user?.role ||
        data.role ||
        "ADMIN"
      ).toUpperCase();

      const token =
        data.accessToken ||
        data.access_token ||
        data.token ||
        "";

      if (!token) {
        throw new Error(
          "No authorization token returned by backend."
        );
      }

      const roleKey =
        userRole === "RECEPTIONIST" ? "RECEPTION" : userRole;

      const lowerKey = roleKey.toLowerCase();

      sessionStorage.setItem("token", token);

      // Added only this user session data
      sessionStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user?.id || "",
          email: data.user?.email || cleanEmail,
          name: data.user?.name,
          role: userRole,
        })
      );

      sessionStorage.setItem("userRole", userRole);

      sessionStorage.setItem(
        "userEmail",
        data.user?.email || cleanEmail
      );

      sessionStorage.setItem(
        `${lowerKey}_token`,
        token
      );

      sessionStorage.setItem(
        `${lowerKey}_role`,
        userRole
      );

      sessionStorage.setItem(
        `${lowerKey}_email`,
        data.user?.email || cleanEmail
      );

      sessionStorage.setItem(
        "session_started_at",
        Date.now().toString()
      );

      if (userRole === "DOCTOR") {
        queueToast(
          "Login successful. Opening Doctor Panel.",
          "success"
        );

        window.location.href = "/doctor/dashboard";
      } else if (
        userRole === "RECEPTION" ||
        userRole === "RECEPTIONIST"
      ) {
        queueToast(
          "Login successful. Opening Reception Desk.",
          "success"
        );

        window.location.href = "/reception/dashboard";
      } else {
        queueToast(
          "Login successful. Opening Admin Dashboard.",
          "success"
        );

        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Unable to authenticate.");

      showToast(
        err.message || "Unable to authenticate.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAutofill = (
    role: "ADMIN" | "DOCTOR" | "RECEPTION"
  ) => {
    if (role === "ADMIN") {
      setEmail("admin@drbloomedi.com");
      setPassword("Admin@1234");
    } else if (role === "DOCTOR") {
      setEmail("doctor@gmail.com");
      setPassword("11111111");
    } else {
      setEmail("rajesh@gmail.com");
      setPassword("22222222");
    }

    setError("");
  };

  return (
    <div className="min-h-screen">
      {/* Keep your existing login UI here exactly as it was */}
    </div>
  );
}