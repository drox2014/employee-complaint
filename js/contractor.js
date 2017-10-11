var db = firebase.database().ref();
var user = null;

var State = {
    NEW: 0,
    E_REJ: 1,
    E_APP: 2,
    C_REJ: 3,
    C_APP: 4,
    C_SOL: 5,
    T_SOL: 6
};

$(document).ready(function () {
    setTimeout(function () {
        user = firebase.auth().currentUser;
        if (user) {
            db.child('user').child(user.uid).once('value', function (snapshot) {
                if (snapshot.val().designation != "CONTR") {
                    return window.location = 'index.html'
                } else {
                    $('body').fadeIn(0);
                    emailjs.init("user_f5gjxUk9bUuqdRhBgTjYa");
                }
            });
        } else {
            return window.location = 'index.html'
        }
    }, 1500);
});

$('form#acccount-settings-form').on('submit', function (e) {
    e.preventDefault();
    var user = firebase.auth().currentUser;
    var newPassword = $('[name=ac_new_pw]').val();
    var confPassword = $('[name=ac_conf_pw]').val();

    if (confPassword && newPassword) {
        if (confPassword == newPassword) {
            user.updatePassword(newPassword).then(function () {
                alert('Password changed successfully :)')
            }).catch(function (error) {
                alert('Unable to change password :(')
            });
        } else {
            alert('Password are not matching :(')
        }
    } else {
        alert('Password fields cannot be empty :(')
    }

});

$('form#solve-complaint-form').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=project-name]').val();
    var refNo = $('[name=ref-no]').val();

    var reasonToReject = "";
    var contractorSolution = $('[name=sol-cont-solution]').val();
    var state = State.T_SOL;

    db.child('complaint').child(projectName).child(refNo).update({
        reasonToReject,
        contractorSolution,
        state
    }).then(function () {
        var files = $('[name=sol-cont-photo]').get(0).files;
        var fileRef = [];
        for (var index = 0; index < files.length; index++) {
            var file = files[index];
            fileRef.push(file.name);
            firebase.storage().ref().child(projectName).child(refNo).child('contractor').child(file.name).put(file);
        }
        db.child('image-ref').child(projectName).child(refNo).child('contractor').set({fileRef});
        db.child('project-assign').child(projectName).once('value', function (snapshot) {
            var users = snapshot.val();
            for (let userId in users) {
                if (users[userId].designation == "Consultant") {
                    var user = users[userId];
                    var email = {};
                    email.email = user.email;
                    email.name = user.name;
                    email.message = "We have submitted a new solution for " + projectName + " with the reference number " + refNo + ". We're looking forward for your immediate response.";
                    sendEmail(email);
                }
            }
        });
        alert('Complaint was approved successfully :)');
        alert('Complaint was solved successfully :)');
    }).catch(function (e) {
        alert('Unable to approve the complaint, ' + e.message);
    });
});

function fillPendingTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('pending-table');

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {

                        while (table.rows.length > 1) {
                            table.deleteRow(-1);
                        }

                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.C_SOL || ref[id].state == State.T_SOL) {
                                setTimeout(function () {
                                    var refId = id;
                                    var complaint = ref[refId];
                                    var row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(4).innerHTML = complaint.name;
                                    row.insertCell(5).innerHTML = complaint.gsDivision;
                                    row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(7).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(8).innerHTML = complaint.significance;
                                    row.insertCell(9).innerHTML = complaint.actionTakenBy;

                                    var moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    var moreDetailsBtnCell = row.insertCell(10);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                                    var solveButton = document.createElement('input');
                                    solveButton.type = 'button';
                                    solveButton.className = 'btn btn-success';
                                    solveButton.value = 'Solve';
                                    solveButton.setAttribute('data-toggle', 'modal');
                                    solveButton.setAttribute('data-target', '#solve-form');
                                    solveButton.setAttribute('data-project', project);
                                    solveButton.setAttribute('data-ref', id);
                                    solveButton.addEventListener('click', (e) => fillForm(e.target));

                                    var solveButtonCell = row.insertCell(11);
                                    solveButtonCell.style.verticalAlign = 'middle';
                                    solveButtonCell.appendChild(solveButton);
                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillRejectedTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).on('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('rejected-table');

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).on('value', function (complaints) {

                        while (table.rows.length > 1) {
                            table.deleteRow(-1);
                        }

                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.C_REJ) {
                                setTimeout(function () {
                                    var refId = id;
                                    var complaint = ref[refId];
                                    var row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(4).innerHTML = complaint.name;
                                    row.insertCell(5).innerHTML = complaint.gsDivision;
                                    row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(7).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(8).innerHTML = complaint.significance;
                                    row.insertCell(9).innerHTML = complaint.actionTakenBy;

                                    var moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    var moreDetailsBtnCell = row.insertCell(10);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                                    var solveButton = document.createElement('input');
                                    solveButton.type = 'button';
                                    solveButton.className = 'btn btn-success';
                                    solveButton.value = 'Solve';
                                    solveButton.setAttribute('data-toggle', 'modal');
                                    solveButton.setAttribute('data-target', '#solve-form');
                                    solveButton.setAttribute('data-project', project);
                                    solveButton.setAttribute('data-ref', id);
                                    solveButton.addEventListener('click', (e) => fillForm(e.target));

                                    var solveButtonCell = row.insertCell(11);
                                    solveButtonCell.style.verticalAlign = 'middle';
                                    solveButtonCell.appendChild(solveButton);
                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillApprovedTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).on('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('approved-table');

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).on('value', function (complaints) {

                        while (table.rows.length > 1) {
                            table.deleteRow(-1);
                        }

                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.C_APP || ref[id].state == State.E_APP) {
                                setTimeout(function () {
                                    var refId = id;
                                    var complaint = ref[refId];
                                    var row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(4).innerHTML = complaint.name;
                                    row.insertCell(5).innerHTML = complaint.gsDivision;
                                    row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(7).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(8).innerHTML = complaint.significance;
                                    row.insertCell(9).innerHTML = complaint.actionTakenBy;

                                    var moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    var moreDetailsBtnCell = row.insertCell(10);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);
                                }, 0);
                            }
                        }
                    });
                }, 0);
            }
        });
    }, 2000);
}

function fillProjectCombo() {
    db.child('project').on('value', function (snapshot) {
        $('[name=sc-project-name]').find('option').remove()

        var project = snapshot.val();

        for (let name in project) {
            $('[name=sc-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
        }
    });
}

function signout() {
    firebase.auth().signOut().then(function () {
        window.location = 'index.html'
    }).catch(function (error) {
        alert('Unable to connect to server :(')
    });
}

function fillForm(target) {
    var project = target.getAttribute('data-project');
    var ref = target.getAttribute('data-ref');
    db.child('complaint').child(project).child(ref).once('value', function (snapshot) {
        var complaint = snapshot.val();
        if (complaint) {
            $('[name=project-name]').val(project);
            $('[name=ref-no]').val(ref);
            $('[name=name]').val(complaint.name);
            $('[name=nic-no]').val(complaint.nicNo);
            $('[name=date]').val(complaint.date);
            $('[name=address]').val(complaint.address);
            $('[name=gs-division]').val(complaint.gsDivision);
            $('[name=phone-no]').val(complaint.phoneNo);
            $('[name=cat-grievance]').val(complaint.categoryOfGrievance);
            $('[name=nature-of-grievance]').val(complaint.natureOfGrievance);
            $('[name=significance]').val(complaint.significance);
            $('[name=action-taken-by]').val(complaint.actionTakenBy);
            $('[name=action]').val(complaint.action);
            $('[name=date-reported]').val(complaint.dateReported);
            $('[name=cons-solution]').val(complaint.consultantSolution);
            var url = 'slider.html?project=' + project + '&ref=' + ref + '&type=';
            $('[name=employee-link]').attr('href', url + 'employee');
            $('[name=consultant-link]').attr('href', url + 'consultant');
            $('[name=contractor-link]').attr('href', url + 'contractor');

            if(complaint.state == State.E_APP){
                $('div.approved-content').show();
                $('[name=date-reported]').val(complaint.dateReported);
                $('[name=date-closed]').val(complaint.dateClosed);
                $('[name=further-action]').val(complaint.furtherAction);
                $('[name=action-taken ]').val(complaint.actionTaken);
            }else{
                $('div.approved-content').hide();
            }

            if(complaint.state == State.C_REJ){
                $('div.rejected-content').show();
                $('[name=reason-to-reject]').val(complaint.reasonToReject);
            }else{
                $('div.rejected-content').hide();
            }
        }
    });
}

function sendEmail(email) {
    emailjs.send("gmail", "template", {
        "toEmail": email.email,
        "name": email.name,
        "message": email.message
    })
}

fillProjectCombo();
fillPendingTable();
fillApprovedTable();
fillRejectedTable();