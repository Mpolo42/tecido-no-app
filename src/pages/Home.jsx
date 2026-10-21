import Hero from '../components/Hero';
import Sinais from '../components/Sinais';
import Cuidados from '../components/Cuidados';
import Produto from '../components/Produto';
import Classificacao from '../components/Classificacao';
import FAQ from '../components/FAQ';

import hero from '../assets/img/pes.jpeg';
import cuidepe from '../assets/img/cuidepe.jpg';
import produto from '../assets/img/produto.jpg';
import grau1 from '../assets/img/grau1.png';
import grau2 from '../assets/img/grau2.png';
import grau3 from '../assets/img/grau3.png';
import grau4 from '../assets/img/grau4.png';
import grau5 from '../assets/img/grau5.png';

export default function Home() {
  return (
    <>
      <Hero heroImg={hero} />
      <Sinais />
      <Cuidados cuidepeImg={cuidepe} />
      <Produto produtoImg={produto} />
      <Classificacao grausImgs={{ grau1, grau2, grau3, grau4, grau5 }} />
      <FAQ />
    </>
  );
}