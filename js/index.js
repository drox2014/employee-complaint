$('form#login-form').on('submit', function (e) {
    e.preventDefault();

    var username = $('[name=username]').val();
    var password = $('[name=password]').val();

    firebase.auth().signInWithEmailAndPassword(username, password).then(function () {
        var user = firebase.auth().currentUser;
        firebase.database().ref().child('user').child(user.uid).once('value').then(function (snapshot) {
            var role = snapshot.val().designation;

            if(role == 'ADMIN'){
                window.location = 'employee.html';
            }else if(role == 'CONTR'){
                window.location = 'contractor.html';
            }else{
                window.location = 'consultant.html';
            }
        });
    }).catch(function (error) {
        return alert(error.message);
    });
});