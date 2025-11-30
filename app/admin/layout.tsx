import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
	title: "Adminolala - Admin Panel",
	description: "Admin panel for Agricolala",
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
