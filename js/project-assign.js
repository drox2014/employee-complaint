var db = firebase.database().ref();

db.child('project').on('value', function (snapshot) {
    $('[name=project-name]').find('option').remove()

    var project = snapshot.val();

    for (let name in project) {
        $('[name=project-name]').append($('<option>', {
            val: name,
            text: name
        }));
    }
});

db.child('user').on('value', function (snapshot) {
    $('[name=name]').find('option').remove()

    var users = snapshot.val();

    for (let userId in users) {
        $('[name=name]').append($('<option>', {
            val: userId,
            text: users[userId].name
        }));
    }
});

$('[name=name]').on('change', function () {
    var userId = $('[name=name]').val();

    db.child('user').child(userId).once('value', function (snapshot) {
        var user = snapshot.val();

        $('[name=nic]').val(user.nic);
        $('[name=address]').val(user.address);
        $('[name=mobile]').val(user.mobileNo);
        if (user.designation == "ADMIN") {
            $('[name=designation]').val('Admin');
        } else if (user.designation == "CONTR") {
            $('[name=designation]').val('Contractor');
        } else {
            $('[name=designation]').val('Consultant');
        }
        $('[name=email]').val(user.email);
    });
});

$('[name=project-name]').on('change', function () {
    loadProjectAssignTable();
});


function loadUser() {
    $('[name=name]').trigger("change");
}

$('form#assign-user').on('submit', function (e) {
    e.preventDefault();

    var project = $('[name=project-name]').val();
    var userId = $('[name=name]').val();

    db.child('project-assign').child(project).child(userId).set({
        name:$("[name=name] option:selected").text(),
        designation:$('[name=designation]').val(),
        email:$('[name=email]').val()
    });

    db.child('project-assign-user').child(userId).child(project).set({
        name:$("[name=name] option:selected").text(),
        designation:$('[name=designation]').val()
    });
});

function loadProjectAssignTable() {
    var table = document.getElementById('user-table');
    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }
    var project = $('[name=project-name]').val();
    if(project){
        db.child('project-assign').child(project).once('value', function (snapshot) {
            users = snapshot.val();
            for (var key in users) {
                var user = users[key];
                var rowData = table.insertRow(-1);
                rowData.insertCell(0).innerHTML = user.name;
                rowData.insertCell(1).innerHTML = user.designation;
                var btn = document.createElement('input');
                btn.type = "button";
                btn.className = "btn btn-fill btn-danger";
                btn.value = "Delete";
                btn.onclick = function () {
                    if (confirm('Do you want to continue?')) {
                        db.child('project-assign').child(project).child(key).remove();
                        loadProjectAssignTable();
                    }

                };
                rowData.insertCell(2).appendChild(btn);
            }
        })
    }
}

