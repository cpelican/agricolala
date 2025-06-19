import type { NextAdminOptions } from "@premieroctet/next-admin";

const options: NextAdminOptions = {
	title: "Adminolala",
	model: {
		User: {
			list: {
				display: ["name", "email", "isAdmin"],
			},
			edit: {
				display: ["name", "email", "isAdmin"],
			},
		},
		AdminUser: {
			list: {
				display: ["email"],
			},
			edit: {
				display: ["email"],
			},
			toString: (item) => item.email,
		},
		Parcel: {
			list: {
				display: [
					"name",
					"latitude",
					"longitude",
					"width",
					"height",
					"type",
					"user",
					"treatments",
				],
			},
			edit: {
				display: [
					"name",
					"latitude",
					"longitude",
					"width",
					"height",
					"type",
					"user",
					"treatments",
				],
			},
		},
		Product: {
			list: {
				display: [
					"name",
					"brand",
					"maxCumulatedQuantity",
					"maxApplications",
					"composition",
					"productApplications",
				],
			},
		},
		Substance: {
			list: {
				display: ["name", "maxDosage", "diseases", "substanceDoses"],
			},
			edit: {
				display: ["name", "maxDosage", "diseases"],
			},
		},
		Disease: {
			list: {
				display: ["name"],
			},
			edit: {
				display: ["name", "description"],
			},
		},
	},
	sidebar: {
		groups: [
			{
				className: "pt-5 text-lg !text-white !bg-gray-800",
				title: "Models",
				models: [
					"User",
					"AdminUser",
					"Parcel",
					"Product",
					"Substance",
					"Disease",
				],
			},
		],
	},
};

export default options;
