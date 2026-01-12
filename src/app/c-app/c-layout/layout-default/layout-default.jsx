import { Outlet } from 'react-router-dom';

function layoutDefault() {
  return (
  <div className="dashboard-layout">
    <aside className="sidebar">SIDEBAR</aside>

    <main className="content">
      <header className="header">HEADER</header>

      <section className="page">
        <Outlet /> {/* PAGE CON */}
      </section>
    </main>
  </div>
  )
}

console.log('pageLayout', layoutDefault);

export default layoutDefault;
