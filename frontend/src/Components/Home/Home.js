import React from 'react';
import Form from '../Form/Form';
import './style.css';

const Home = () => {
  return (
    <section className="content">
      <img 
        src="https://flowpodcast.com.br/wp-content/uploads/2020/04/FLOW-1-1.png" 
        alt="Flow logo"
      />

      <Form />
    </section>
  ); 
}

export default Home;