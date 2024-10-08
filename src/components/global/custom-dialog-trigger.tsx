import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import clsx from "clsx";

import React from "react";

interface CustomDialogTriggerProps {
	header?: string;
	content?: React.ReactNode;
	children: React.ReactNode;
	description?: string;
	className?: string;
}

const CustomDialogTrigger: React.FC<CustomDialogTriggerProps> = ({
	header,
	content,
	children,
	description,
	className,
}) => {
	return (
		<Dialog>
			<DialogTrigger className={clsx("", className)}>{children}</DialogTrigger>
			<DialogContent className="h-screen block sm:h-[440px] overflow-scroll w-full">
				<DialogHeader>
					<DialogTitle className="mb-2">{header}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{content}
			</DialogContent>
		</Dialog>
	);
};

export default CustomDialogTrigger;
