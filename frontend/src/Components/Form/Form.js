import React, { useState } from 'react'
import './style.css'

const Form = () => {
  const [value, setValue] = useState('')

  function handleChange(event) {
    return setValue(event.target.value)
  }

  function handleSubmit(event) {
    // Get the ID from the youtube URL
    const videoId = value.replace('https://www.youtube.com/watch?v=', '') 

    const reqUrl = `http://localhost:5000/api?videoId=${videoId}`

    const iframe = document.querySelector('#iframe')
    
    // The iframe will trigger the video's download
    iframe.src = reqUrl  

    event.preventDefault()
  }

  return (
    <form>
      <h1>Insira a URL do podcast desejado:</h1>

      <input  
        type="url" 
        value={value}
        onChange={handleChange}
        placeholder="https://www.youtube.com/watch?v=..."
      />

      <input type="submit" value="Baixar trecho" onClick={handleSubmit}/>

      <iframe id="iframe" title="iframe" style={{display: 'none'}} /> 
    </form>
  );
}

export default Form;