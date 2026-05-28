import ProjectCard from '../components/ProjectCard';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link?: string;
}

const projects: Project[] = [
  {
    title: 'Интернет-магазин',
    description:
      'Полнофункциональный интернет-магазин с корзиной и оплатой',
    technologies: ['Next.js', 'TypeScript', 'Stripe'],
    link: 'https://example.com',
  },
  {
    title: 'To-Do приложение',
    description: 'Приложение для управления задачами на React и Vite',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
  },
  {
    title: 'Портфолио-сайт',
    description: 'Многостраничный сайт с блогом и статической генерацией',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS'],
  },
];

export default function ProjectsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Мои проекты</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.title}
            title={project.title}
            description={project.description}
            technologies={project.technologies}
            link={project.link}
          />
        ))}
      </div>
    </div>
  );
}
