import { UserProfile } from "@/lib/models";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { BASE_URL } from "@/lib/constants";
import ProfileView from "./ProfileView";

interface PageProps {
  params: Promise<{ uid: string }>;
}

async function fetchGitHubRepos(username: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((repo: any) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      html_url: repo.html_url
    }));
  } catch (error) {
    console.error("GitHub Fetch Error:", error);
    return [];
  }
}

async function fetchPubMedArticles(pmids: string[]) {
  if (!pmids || pmids.length === 0) return [];
  try {
    const idParam = pmids.join(",");
    const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idParam}&retmode=json`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data.result;
    return pmids.map(id => {
      const article = result[id];
      if (!article) return null;
      return {
        uid: id,
        title: article.title,
        authors: article.authors?.map((a: any) => a.name).join(", "),
        source: article.source,
        pubdate: article.pubdate?.split(" ")[0],
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}`
      };
    }).filter(Boolean);
  } catch (error) {
    console.error("PubMed Fetch Error:", error);
    return [];
  }
}

async function fetchDOIArticles(dois: string[]) {
  if (!dois || dois.length === 0) return [];
  try {
    const fetchPromises = dois.map(async (doi) => {
      const res = await fetch(`https://api.crossref.org/works/${doi}`, {
        next: { revalidate: 3600 }
      });
      if (!res.ok) return null;
      const json = await res.json();
      const item = json.message;
      return {
        uid: doi,
        title: item.title?.[0] || "Unknown Title",
        authors: item.author?.map((a: any) => `${a.given} ${a.family}`).join(", ") || "Unknown Authors",
        source: item['container-title']?.[0] || "DOI Indexed",
        pubdate: item.created?.['date-parts']?.[0]?.[0] || "N/A",
        url: `https://doi.org/${doi}`
      };
    });
    const results = await Promise.all(fetchPromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error("DOI Fetch Error:", error);
    return [];
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { uid: identifier } = await params;

  let userData: UserProfile | null = null;

  try {
    const docRef = doc(db, "users", identifier);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      userData = docSnap.data() as UserProfile;
    } else {
      const q = query(collection(db, "users"), where("slug", "==", identifier), limit(1));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        userData = querySnap.docs[0].data() as UserProfile;
      }
    }
  } catch (error) {
    console.error("Firestore Fetch Error:", error);
    throw new Error("Failed to load profile data.");
  }

  if (!userData) return notFound();

  const actualUid = userData.uid;

  // Fetch Live Data only if toggled on
  const fetchPromises = [];
  if (userData.showGitHub && userData.githubUsername) {
    fetchPromises.push(fetchGitHubRepos(userData.githubUsername));
  } else {
    fetchPromises.push(Promise.resolve([]));
  }

  if (userData.showPublications) {
    const pmids = userData.pubmedIds || [];
    const dois = userData.doiIds || [];
    fetchPromises.push(Promise.all([
      pmids.length > 0 ? fetchPubMedArticles(pmids) : Promise.resolve([]),
      dois.length > 0 ? fetchDOIArticles(dois) : Promise.resolve([])
    ]));
  } else {
    fetchPromises.push(Promise.resolve([[], []]));
  }

  const [repos, pubData] = await Promise.all(fetchPromises);
  const allArticles = [...pubData[0], ...pubData[1]];

  const publicProfileUrl = userData.slug ? `${BASE_URL}/u/${userData.slug}` : `${BASE_URL}/u/${actualUid}`;

  return (
    <ProfileView 
      userData={userData}
      repos={repos}
      allArticles={allArticles}
      actualUid={actualUid}
      publicProfileUrl={publicProfileUrl}
    />
  );
}
