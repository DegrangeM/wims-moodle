if (typeof window.WimsMoodleElements === 'undefined') {
  // Normalement ce script ne devrait être chargé qu'une unique fois car appelé en module
  // On vérifie tout de même au cas où que le fichier ne soit pas appelé en module
  window.WimsMoodleElements = []

  window.addEventListener('message', (event) => {
    if (event.data?.action == 'wims::result') {
      const iMoodle = 0
      if (typeof window.WimsMoodleElements[iMoodle] !== 'undefined') {
        const iframe = window.WimsMoodleElements[iMoodle]
        if (event.data.result.score !== undefined) {
          const moodleScore = Math.round(event.data.result.score) * 10
          iframe.parentNode.parentNode.querySelector('[name$="_answer"]').value = moodleScore
          iframe.parentNode.parentNode.querySelector('[name$="_-submit"]')?.click()
        }
      }
    }
  })

  const style = document.createElement('style')
  style.innerHTML = '.wims-question-type .form-inline, .wims-question-type .im-controls, .wims-question-type .rightanswer { display: none; }'
  document.head.appendChild(style)

  class WimsMoodle extends HTMLElement {
    connectedCallback() {
      let PAGE_URL
      try {
        PAGE_URL = new URL(this.getAttribute('url'))
        if (PAGE_URL.protocol !== 'http:' && PAGE_URL.protocol !== 'https:') {
          throw new Error('Le serveur doit avoir un protocol en http ou https')
        }
        PAGE_URL = PAGE_URL.href
      } catch (e) {
        PAGE_URL = 'data:text,' + e
      }

      const shadow = this.attachShadow({ mode: 'open' }) // this.shadowRoot

      const iMoodle = window.WimsMoodleElements.length

      if (iMoodle > 0) {
        alert('Attention, il y a déjà une intégration de Wims sur la page')
      }

      let questionDiv = this.parentNode
      // On remonte de parent en parent depuis la balise script jusqu'à trouver le div avec le numero de la question en id
      while (questionDiv !== null) { // s'arrêtera lorsqu'il n'y aura plus de parents
        if (typeof questionDiv.id === 'string' && questionDiv.id.startsWith('question-')) {
          break
        }
        questionDiv = questionDiv.parentNode
      }

      if (questionDiv === null) {
        shadow.appendChild(document.createTextNode('[Erreur de détection de la l’environnement moodle]'))
        return
      }

      questionDiv.classList.add('wims-question-type')

      const iframe = document.createElement('iframe')
      this.iframe = iframe
      window.WimsMoodleElements.push(this)

      iframe.setAttribute('width', '100%')
      iframe.style.height = '80vh'
      iframe.setAttribute('src', PAGE_URL)
      iframe.setAttribute('frameBorder', '0')
      iframe.setAttribute('allow', 'fullscreen')

      if (!questionDiv.classList.contains('notyetanswered')) {
        iframe.style.pointerEvents = 'none';
        iframe.style.filter = 'blur(5px)';
        const successMessage = document.createElement('div');
        successMessage.textContent = 'Vous avez déjà effectué cet exercice';
        successMessage.setAttribute('style', 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);background-color: lightgreen;padding: 10px;border: 1px solid green;color: green;');
        shadow.appendChild(iframe)
        shadow.appendChild(successMessage)
      } else {
        const fullscreenIcon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAB2HAAAdhwGP5fFlAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAEtJREFUWIXtl0EKACAIBNv+/+ftbqBIRBAzV00HhSjZ9mggSVm8W292km+AgOLOqh2fEvs9nwACCCAAAMB7AAEEENjugfIAf8PfBBYFhyAdDEK+jwAAAABJRU5ErkJggg==';
        const fullscreenElement = document.createElement('img');
        fullscreenElement.setAttribute('src', fullscreenIcon);
        fullscreenElement.setAttribute('style', 'position: absolute;top: 25px;right: 45px;cursor: pointer;');
        fullscreenElement.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            this.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        });
        shadow.appendChild(iframe)
        shadow.appendChild(fullscreenElement)
      }

    }

    attributeChangedCallback(name, oldValue, newValue) {
      name === 'height' && (this.iframe.style.height = newValue)
    }

    static get observedAttributes() { return ['height'] }
  }

  // Define the new element
  customElements.define('wims-moodle', WimsMoodle)
}