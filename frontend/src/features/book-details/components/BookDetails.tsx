import InfoItem from './InfoItem';
import ExemplarRow from './ExemplarRow';
import capaLivro from '@/assets/images/capa-livro.jpg'; 

export default function BookDetails() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <header className="bg-white border-b-2 border-purple-600 px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800"> Libee</h1>
        <nav className="flex gap-6">
          <a href="/acervo" className="flex items-center gap-2 text-gray-600 hover:text-purple-600">📚 Acervo</a>
          <a href="/emprestimos" className="flex items-center gap-2 text-gray-600 hover:text-purple-600"> Empréstimos</a>
          <button className="text-gray-600"></button>
          <button className="text-gray-600"></button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-8">
        <button className="text-gray-500 hover:text-purple-600 mb-6 flex items-center gap-2">
          ← Voltar para o catálogo
        </button>

        <section className="bg-white rounded-xl p-6 shadow-sm flex gap-8 mb-6">
          <img 
            src={capaLivro} 
            alt="Capa do livro" 
            className="w-48 h-72 object-cover rounded-lg flex-shrink-0 shadow-md" 
/>
            Capa
        
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Título da Obra</h1>
            <p className="text-gray-500 text-lg mb-4">Autor do Livro</p>

            <div className="flex gap-2 mb-6">
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">Romance</span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">Ficção</span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <InfoItem label="Editora" value="Seguinte" />
              <InfoItem label="Publicação" value="2015" />
              <InfoItem label="Edição" value="1ª" />
              <InfoItem label="Local" value="São Paulo" />
              <InfoItem label="Páginas" value="424" />
              <InfoItem label="ISBN" value="978-8565765695" />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Descrição</h2>
          <p className="text-gray-600 leading-relaxed">
            Mare Barrow é uma jovem de sangue vermelho que descobre possuir poderes elétricos, algo que deveria ser exclusivo dos prateados, a elite dominante do mundo. Ela inicialmente vive como ladra e plebeia, mas ao revelar seus poderes durante um evento real chamado Queenstrial, é forçada a se tornar noiva do príncipe Maven, enquanto lida com intrigas políticas e conflitos entre os Vermelhos e Prateados. Mare se envolve com a Guarda Escarlate, um grupo rebelde que luta contra a opressão, e suas ações incluem desafiar o sistema, liderar rebeliões e usar seus poderes para proteger seu povo.
          </p>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Exemplares</h2>
            <span className="text-sm text-gray-500">Total de exemplares: 3</span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-amber-50 text-gray-700">
                <th className="p-3 rounded-l-lg">Tombo</th>
                <th className="p-3">Localização</th>
                <th className="p-3 rounded-r-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <ExemplarRow tombo="01010" local="A11" status="Disponível" />
              <ExemplarRow tombo="01011" local="A11" status="Emprestado" />
              <ExemplarRow tombo="01012" local="A11" status="Disponível" />
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}