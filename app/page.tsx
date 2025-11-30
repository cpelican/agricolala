// This page should never be reached - middleware redirects all requests
export default async function RootPage() {
	console.error("RootPage should never be reached");
	return null;
}
