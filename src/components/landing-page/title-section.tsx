import React from "react";
import Image from "next/image";

interface TitleSectionProps {
	title: string;
	subheading?: string;
	pill: string;
}

const TitleSection: React.FC<TitleSectionProps> = ({
	title,
	subheading,
	pill,
}) => {
	return (
		<React.Fragment>
			<section className="flex flex-col gap-4 justify-center items-center">
				<article className="rounded-full p-[1px] text-sm bg-gradient-to-r from-brand-primaryBlue/70 to-brand-primaryPurple text-white my-3 md:m-7">
					<div className="rounded-full px-3 py-1 dark:bg-black ">{pill}</div>
				</article>
				{subheading ? (
					<>
						<h2 className="text-center text-3xl sm:text-5xl sm:max-w-[750px] font-semibold">
							{title}
						</h2>
						<p className="dark:text-washed-purple-700 sm:max-w-[450px] text-center">
							{subheading}
						</p>
					</>
				) : (
					<div className="relative">
						<h1 className="text-center text-4xl sm:text-6xl sm:max-w-[850px] font-semibold relative z-10">
							{title}
						</h1>
						<div className="absolute w-full flex justify-center -bottom-1 sm:-bottom-2 z-0">
							<Image
								src="/curve.png"
								alt="Curve underline"
								width={300}
								height={20}
								className="w-[200px] sm:w-[300px] object-contain"
							/>
						</div>
					</div>
				)}
			</section>
		</React.Fragment>
	);
};

export default TitleSection;
