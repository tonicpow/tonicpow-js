#### Setup your project (front-end) (for Goal Conversions)
All requests to web applications have the parameter `?tncpw_session=user-session-id` set.
You can use your own implementation for storing the `tncpw_session` and sending it to your back-end.

**Capture The Session**
```javascript
let urlParams = new URLSearchParams(window.location.search)
let session = urlParams.get('tncpw_session') 
```

_(Optional)_ **Save via Cookie Example**
```javascript
setCookie('tncpw_session', session, 60)
``` 

_(Optional)_ **Save via Local Storage Example**
```javascript
localStorage.setItem('tncpw_session', session);
```
