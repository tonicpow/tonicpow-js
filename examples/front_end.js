// sessionName is the incoming query parameter from any link service
const sessionName = 'tncpw_session'

// Capture session if we have a document and window context
if (typeof document !== 'undefined') {

  // This case is for being injected after page load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    captureVisitorSession()
  } else {
    // This loads if the <script> is hardcoded in the html page in the <head>
    document.addEventListener('DOMContentLoaded', function () {
      captureVisitorSession()
    })
  }
}

// captureVisitorSession will capture the session and store it
// Builds a cookie so it's sent on requests automatically
// Stores in local storage for easy access from the application
function captureVisitorSession(customSessionId) {
  if (typeof window === 'undefined') {
    return
  }
  let sessionId = customSessionId
  if (!customSessionId || customSessionId.length === 0) {
    let urlParams = new URLSearchParams(window.location.search)
    sessionId = urlParams.get(sessionName)
  }
  if (sessionId && sessionId.length > 0) {
    setOreo(sessionName, sessionId, 60)
    localStorage.setItem(sessionName, sessionId)
  }
}

// setOreo for creating new oreos
function setOreo(name, value, days) {
  let d = new Date
  d.setTime(d.getTime() + 24*60*60*1000*days)
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString()
}
