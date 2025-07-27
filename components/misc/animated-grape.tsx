export const AnimatedGrape = () => {
	return (
		<div className="relative w-12 h-12">
			{/* Main grape cluster */}
			<div className="relative">
				{/* Top row */}
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "1px", left: "5px" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "1px", left: "8px", animationDelay: "0.1s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "1px", left: "13px", animationDelay: "0.2s" }}
				/>

				{/* Second row */}
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "6px", left: "0px", animationDelay: "0.05s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "6px", left: "5px", animationDelay: "0.15s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "6px", left: "10px", animationDelay: "0.25s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "6px", left: "15px", animationDelay: "0.35s" }}
				/>

				{/* Third row */}
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "11px", left: "2px", animationDelay: "0.1s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "11px", left: "8px", animationDelay: "0.2s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "11px", left: "13px", animationDelay: "0.3s" }}
				/>

				{/* Fourth row */}
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "17px", left: "5px", animationDelay: "0.15s" }}
				/>
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "17px", left: "10px", animationDelay: "0.25s" }}
				/>

				{/* Fifth row - single grape */}
				<div
					className="absolute w-1 h-1 rounded-full animate-grape-color"
					style={{ top: "22px", left: "8px", animationDelay: "0.2s" }}
				/>
			</div>
		</div>
	);
};
