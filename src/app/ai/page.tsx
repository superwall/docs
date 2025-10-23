import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata = {
  title: 'Ask AI',
  description: 'Get instant answers to your questions about Superwall.',
};

function buildQueryString(searchParams: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (typeof value === 'string') {
      params.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === 'string') {
          params.append(key, entry);
        }
      });
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export default async function AIPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  redirect(`/docs/ai${buildQueryString(resolved)}`);
}
