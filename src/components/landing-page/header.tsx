"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import LogoDark from "../../../public/logo-dark.png";
import LogoLight from "../../../public/logo.svg";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";

const routes = [
	{ title: "Features", href: "#features" },
	{ title: "Reasources", href: "#resources" },
	{ title: "Pricing", href: "#pricing" },
	{ title: "Testimonials", href: "#testimonial" },
];

const components: { title: string; href: string; description: string }[] = [
	{
		title: "Alert Dialog",
		href: "#",
		description:
			"A modal dialog that interrupts the user with important content and expects a response.",
	},
	{
		title: "Hover Card",
		href: "#",
		description:
			"For sighted users to preview content available behind a link.",
	},
	{
		title: "Progress",
		href: "#",
		description:
			"Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
	},
	{
		title: "Scroll-area",
		href: "#",
		description: "Visually or semantically separates content.",
	},
	{
		title: "Tabs",
		href: "#",
		description:
			"A set of layered sections of content—known as tab panels—that are displayed one at a time.",
	},
	{
		title: "Tooltip",
		href: "#",
		description:
			"A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
	},
];

const Header = () => {
	const theme = useTheme();
	const [path, setPath] = useState("#products");
	return (
		<header className="p-4 flex justify-center items-center">
			<Link href={"/"} className="w-full flex justify-left items-center gap-2">
				<Image
					src={theme.theme === "dark" ? LogoDark : LogoLight}
					alt="Logo"
					width={25}
					height={25}
				/>
				<span className="font-semibold dark:text-white">NOTE.</span>
			</Link>
			<aside className="flex w-full gap-2 justify-end">
				<Link href={"/login"}>
					<Button
						variant="btn-secondary"
						className="p-1 hidden sm:block dark:text-white"
					>
						Login
					</Button>
				</Link>
				<Link href={"/signup"}>
					<Button
						variant="btn-primary"
						className="whitespace-nowrap dark:text-white"
					>
						Sign Up
					</Button>
				</Link>
			</aside>
		</header>
	);
};

export default Header;
