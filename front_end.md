#### Setup your project (front-end) (for Goal Conversions)
All requests to web applications have the parameter `?tncpw_session=user-session-id` set.
You can use your own implementation for storing the `tncpw_session` and sending it to your back-end application. 
[Goal conversions](https://docs.tonicpow.com/#caeffdd5-eaad-4fc8-ac01-8288b50e8e27) require the user's `tncpw_session`

**Capture The Session**
```javascript
let urlParams = new URLSearchParams(window.location.search)
let sessionId = urlParams.get('tncpw_session') 
```

_(Optional)_ **Save via Cookie Example**
```javascript
setCookie('tncpw_session', sessionId, 60)
``` 

_(Optional)_ **Save via Local Storage Example**
```javascript
localStorage.setItem('tncpw_session', sessionId);
```
