import { getServiceBaseUrl, serviceConfigs } from "@/lib/api";

export default function Home() {
  return (
    <main className="page">
      <section className="card">
        <h1>Green-Cart Frontend</h1>
        <p>
          This standalone frontend microservice is ready for independent deployment.
          Configure service URLs through environment variables.
        </p>

        <h2>Connected Backends</h2>
        <ul>
          {serviceConfigs.map((service) => (
            <li key={service.key}>
              <strong>{service.name}:</strong> {getServiceBaseUrl(service.key) ?? "Not configured"}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
