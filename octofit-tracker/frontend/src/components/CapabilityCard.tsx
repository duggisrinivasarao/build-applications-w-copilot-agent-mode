import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  responseKey: string;
  emptyText: string;
  load: () => Promise<Record<string, unknown>>;
  renderItem: (item: Record<string, unknown>, index: number) => ReactNode;
};

export function CapabilityCard({
  title,
  description,
  responseKey,
  emptyText,
  load,
  renderItem,
}: Props) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);

    load()
      .then((payload) => {
        if (!active) return;
        const values = payload[responseKey];
        setItems(Array.isArray(values) ? values as Record<string, unknown>[] : []);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Request failed');
      });

    return () => {
      active = false;
    };
  }, [responseKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {items === null && error === null && <p role="status">Loading {title.toLowerCase()}...</p>}
        {error !== null && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {items !== null && items.length === 0 && <p>{emptyText}</p>}
        {items !== null && items.length > 0 && (
          <ul className="list-group">
            {items.map((item, index) => (
              <li className="list-group-item" key={index}>
                {renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
