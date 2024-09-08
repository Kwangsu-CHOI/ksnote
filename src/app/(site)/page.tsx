"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Banner from "../../../public/appBanner.png";
import BannerLight from "../../../public/appBanner-light.png";
import BannerDark from "../../../public/appBanner-dark.png";
import Image from "next/image";
import TitleSection from "@/components/landing-page/title-section";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

const HomePage = () => {
	const { theme } = useTheme();
	const router = useRouter();
	const handleSignup = () => {
		router.push("/signup");
	};
	return (
		<section className="w-full flex justify-center items-center min-h-[calc(100vh-76px)]">
			<div className="overflow-hidden px-4 sm:px-6 mt-1 flex flex-col gap-4 justify-center items-center text-center w-full max-w-[800px] min-h-[calc(100vh-76px)]">
				<TitleSection
					title="All-In-One collaborative workspace"
					pill="⭐ Your workspace, perfected!"
				/>
				<div className="bg-white p-[2px] mt-6 rounded-xl bg-gradient-to-r from-primary to-brand-primaryBlue w-full max-w-[305px] mb-10">
					<Link href="/signup" className="z-10 relative bg-transparent">
						<Button
							variant="btn-secondary"
							className="w-full rounded-[10px] p-6 text-2xl bg-background cursor-pointer dark:text-white"
							onClick={handleSignup}
						>
							Join us for free
						</Button>
					</Link>
				</div>
				<div className="w-full flex justify-center items-center relative">
					<div className="w-[70%] max-w-[750px] mt-[20px] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-[0px_15px_45px_0px_#68d391]">
						<Image
							src={theme === "dark" ? BannerDark : BannerLight}
							alt="Banner"
							width={450}
							height={450}
							className="w-full h-auto"
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HomePage;
