const db = firebase.database().ref();

let user = null;

const State = {
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
                if (snapshot.val().designation != "CONSU") {
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
    let user = firebase.auth().currentUser;
    let newPassword = $('[name=ac_new_pw]').val();
    let confPassword = $('[name=ac_conf_pw]').val();

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

$('form#search-complaints').on('submit', function (e) {
    e.preventDefault();

    let projectName = $('[name=sc-project-name]').val();
    let table = document.getElementById('result-table');

    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }

    db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
        let projects = snapshot.val();
        if (!projects) {
            return;
        }
        if (projects.hasOwnProperty(projectName)) {
            db.child('complaint').child(projectName).once('value', function (complaints) {
                let ref = complaints.val();
                for (let id in ref) {
                    let refId = id;
                    let complaint = ref[refId];
                    let row = table.insertRow(-1);
                    row.insertCell(0).innerHTML = projectName;
                    row.insertCell(1).innerHTML = refId;
                    row.insertCell(2).innerHTML = complaint.date;
                    row.insertCell(3).innerHTML = complaint.nicNo;
                    row.insertCell(4).innerHTML = complaint.name;
                    row.insertCell(5).innerHTML = complaint.gsDivision;
                    row.insertCell(6).innerHTML = complaint.phoneNo;
                    row.insertCell(7).innerHTML = complaint.categoryOfGrievance;
                    row.insertCell(8).innerHTML = complaint.significance;
                    row.insertCell(9).innerHTML = complaint.actionTakenBy;

                    let moreDetailsBtn = document.createElement('input');
                    moreDetailsBtn.type = 'button';
                    moreDetailsBtn.className = 'btn btn-info';
                    moreDetailsBtn.value = 'More Details';
                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                    moreDetailsBtn.setAttribute('data-project', projectName);
                    moreDetailsBtn.setAttribute('data-ref', id);
                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                    let moreDetailsBtnCell = row.insertCell(10);
                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                    let approveBtn = document.createElement('input');
                    approveBtn.type = 'button';
                    approveBtn.className = 'btn btn-danger';
                    approveBtn.value = 'Accept';
                    approveBtn.disabled = complaint.state == State.E_APP;
                    approveBtn.setAttribute('data-toggle', 'modal');
                    approveBtn.setAttribute('data-target', '#approved-form');
                    approveBtn.setAttribute('data-project', projectName);
                    approveBtn.setAttribute('data-ref', id);
                    approveBtn.addEventListener('click', (e) => fillForm(e.target));

                    let approveBtnCell = row.insertCell(11);
                    approveBtnCell.style.verticalAlign = 'middle';
                    approveBtnCell.appendChild(approveBtn);

                    let rejectBtn = document.createElement('input');
                    rejectBtn.type = 'button';
                    rejectBtn.className = 'btn btn-danger';
                    rejectBtn.value = 'Reject';
                    rejectBtn.disabled = complaint.state == State.E_APP;
                    rejectBtn.setAttribute('data-toggle', 'modal');
                    rejectBtn.setAttribute('data-target', '#reject-form');
                    rejectBtn.setAttribute('data-project', projectName);
                    rejectBtn.setAttribute('data-ref', id);
                    rejectBtn.addEventListener('click', (e) => fillForm(e.target));

                    let rejectBtnCell = row.insertCell(12);
                    rejectBtnCell.style.verticalAlign = 'middle';
                    rejectBtnCell.appendChild(rejectBtn);
                }
            });
        }
    });
});

$('form#approved-complaint-form').on('submit', function (e) {
    e.preventDefault();

    let projectName = $('[name=project-name]').val();
    let refNo = $('[name=ref-no]').val();

    let state = State.C_APP;

    db.child('complaint').child(projectName).child(refNo).update({
        state
    }).then(function () {
        db.child('project-assign').child(projectName).once('value', function (snapshot) {
            let users = snapshot.val();
            for (let userId in users) {
                if (users[userId].designation == "Admin") {
                    let user = users[userId];
                    let email = {};
                    email.email = user.email;
                    email.name = user.name;
                    email.message = "We have submitted a new solution for " + projectName + " with the reference number " + refNo + ". We're looking forward for your immediate response.";
                    sendEmail(email);
                    location.reload();
                }
            }
        });
        alert('Complaint was approved successfully :)');
    }).catch(function (e) {
        alert('Unable to approve the complaint, ' + e.message);
    });
});

$('form#solve-complaint-form').on('submit', function (e) {
    e.preventDefault();

    let projectName = $('[name=project-name]').val();
    let refNo = $('[name=ref-no]').val();

    let consultantSolution = $('[name=sol-cons-solution]').val();
    let state = State.C_SOL;
    db.child('complaint').child(projectName).child(refNo).update({
        consultantSolution,
        state
    }).then(function () {
        let files = $('[name=sol-cons-photo]').get(0).files;
        if (files.length) {
            let fileRef = [];
            let count = 0;
            for (let index = 0; index < files.length; index++) {
                let file = files[index];
                fileRef.push(file.name);
                firebase.storage().ref().child(projectName).child(refNo).child(file.name).put(file).on('state_changed', function(snapshot){}, function(error) {
                    alert(error.message);
                }, function() {
                    if(++count == files.length){
                        db.child('project-assign').child(projectName).once('value', function (snapshot) {
                            let users = snapshot.val();
                            for (let userId in users) {
                                if (users[userId].designation == "Contractor") {
                                    let user = users[userId];
                                    let email = {};
                                    email.email = user.email;
                                    email.name = user.name;
                                    email.message = "You have received a new complaint from " + projectName + " holding the reference number " + refNo + ". We're looking forward for your immediate action.";
                                    sendEmail(email);
                                    db.child('image-ref').child(projectName).child(refNo).child('consultant').set({fileRef});
                                    location.reload();
                                }
                            }
                        });
                        alert('Complaint was solved successfully :)');
                    }
                });
            }
        } else {
            db.child('project-assign').child(projectName).once('value', function (snapshot) {
                let users = snapshot.val();
                for (let userId in users) {
                    if (users[userId].designation == "Contractor") {
                        let user = users[userId];
                        let email = {};
                        email.email = user.email;
                        email.name = user.name;
                        email.message = "You have received a new complaint from " + projectName + " holding the reference number " + refNo + ". We're looking forward for your immediate action.";
                        sendEmail(email);
                        db.child('image-ref').child(projectName).child(refNo).child('consultant').set({fileRef});
                        location.reload();
                    }
                }
                alert('Complaint was solved successfully :)');
            });
        }
    }).catch(function (e) {
        alert('Unable to approve the complaint, ' + e.message);
    });
});

$('form#reject-complaint-form').on('submit', function (e) {
    e.preventDefault();

    let projectName = $('[name=project-name]').val();
    let refNo = $('[name=ref-no]').val();

    let reasonToReject = $('[name=rj-reason]').val();
    let state = State.C_REJ;

    console.log(reasonToReject);
    db.child('complaint').child(projectName).child(refNo).update({
        reasonToReject,
        state
    }).then(function () {
        db.child('project-assign').child(projectName).once('value', function (snapshot) {
            let users = snapshot.val();
            for (let userId in users) {
                if (users[userId].designation == "Contractor") {
                    let user = users[userId];
                    let email = {};
                    email.email = user.email;
                    email.name = user.name;
                    email.message = "Your solution for" + projectName + " with the reference number " + refNo + " was rejected. Please submit a new solution.";
                    sendEmail(email);
                    location.reload();
                }
            }
        });
        alert('Complaint was rejected :(');
    }).catch(function (e) {
        alert('Unable to reject the complaint, ' + e.message);
    });
    $('[name=rj-close]').click();
});

$('form#new-complaint-form').on('submit', function (e) {

    e.preventDefault();
    $('#new-complaint-submit').attr('disabled', true);
    let projectName = $('[name=nc-project-name]').val();
    let refNo = $('[name=nc-ref-no]').val();
    let date = $('[name=nc-date]').val();
    let name = $('[name=nc-name]').val();
    let address = $('[name=nc-address]').val();
    let gsDivision = $('[name=nc-gs-division]').val();
    let phoneNo = $('[name=nc-phone-no]').val();
    let nicNo = $('[name=nc-nic-no]').val();
    let natureOfGrievance = $('[name=nc-nature-grievance]').val();
    let significance = $('[name=nc-significance]').val();
    let categoryOfGrievance = getSelectedCategoriesOfGrievance();
    let actionTakenBy = $('[name=nc-action-taken-by]').val();
    let action = $('[name=nc-action]').val();
    let dateReported = $('[name=nc-date-reported]').val();
    let closedOutBy = "";
    let dateClosed = "";
    let furtherAction = "";
    let actionTaken = "";
    let consultantSolution = "";
    let contractorSolution = "";
    let state = "";

    if (actionTakenBy == "None") {
        state = State.NEW;
    } else {
        state = State.C_SOL;
    }

    let complaint = {
        date,
        name,
        address,
        gsDivision,
        phoneNo,
        nicNo,
        natureOfGrievance,
        significance,
        categoryOfGrievance,
        actionTakenBy,
        action,
        dateReported,
        closedOutBy,
        dateClosed,
        furtherAction,
        actionTaken,
        consultantSolution,
        contractorSolution,
        state
    };
    db.child('complaint').child(projectName).child(refNo).once('value').then(function (snapshot) {
        if (snapshot.exists()) {
            alert('You already registered a complint under this reference number');
            $('#new-complaint-submit').attr('disabled', false);
        } else {
            db.child('complaint').child(projectName).child(refNo).set(complaint).then(function () {
                let files = $('[name=nc-photo]').get(0).files;
                if(files.length > 0){
                    let fileRef = [];
                    let count = 0;
                    for (let index = 0; index < files.length; index++) {
                        let file = files[index];
                        fileRef.push(file.name);
                        firebase.storage().ref().child(projectName).child(refNo).child('employee').child(file.name).put(file).on('state_changed', function(snapshot){}, function(error) {
                            alert(error.message);
                        }, function() {
                            if(++count == files.length){
                                db.child('project-assign').child(projectName).once('value', function (snapshot) {
                                    let users = snapshot.val();
                                    for (let userId in users) {
                                        if (users[userId].designation == "Admin") {
                                            let user = users[userId];
                                            let email = {};
                                            email.email = user.email;
                                            email.name = user.name;
                                            email.message = "You have received a new complaint from " + projectName + " holding the reference number " + refNo + ". We're looking forward for your immediate action.";
                                            sendEmail(email);
                                            clearComplaintForm();
                                        }
                                    }
                                });
                                db.child('image-ref').child(projectName).child(refNo).child('employee').set({fileRef});
                                alert('Complaint has been submitted successfully : )');
                                $('#new-complaint-submit').attr('disabled', false);
                                clearComplaintForm();
                            }
                        });
                    }
                }else{
                    db.child('project-assign').child(projectName).once('value', function (snapshot) {
                        let users = snapshot.val();
                        for (let userId in users) {
                            if (users[userId].designation == "Admin") {
                                let user = users[userId];
                                let email = {};
                                email.email = user.email;
                                email.name = user.name;
                                email.message = "You have received a new complaint from " + projectName + " holding the reference number " + refNo + ". We're looking forward for your immediate action.";
                                sendEmail(email);
                                clearComplaintForm();
                            }
                        }
                    });
                    alert('Complaint has been submitted successfully : )');
                    $('#new-complaint-submit').attr('disabled', false);
                    clearComplaintForm();
                }
            }).catch(function (e) {
                alert(e.message);
                $('#new-complaint-submit').attr('disabled', false);
            });
        }
    });

});

function fillPendingTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            let projects = snapshot.val();
            let table = document.getElementById('pending-table');

            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    let project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        let ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state != State.E_APP && ref[id].state != State.E_REJ && ref[id].state != State.T_SOL) {
                                setTimeout(function () {
                                    let refId = id;
                                    let complaint = ref[refId];
                                    let row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    // row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(3).innerHTML = complaint.name;
                                    row.insertCell(4).innerHTML = complaint.gsDivision;
                                    // row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(5).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(6).innerHTML = complaint.significance;

                                    let moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let moreDetailsBtnCell = row.insertCell(7);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                                    let solveBtn = document.createElement('input');
                                    solveBtn.type = 'button';
                                    solveBtn.className = 'btn btn-success';
                                    solveBtn.value = 'Instruction';
                                    solveBtn.setAttribute('data-toggle', 'modal');
                                    solveBtn.setAttribute('data-target', '#solve-form');
                                    solveBtn.setAttribute('data-project', project);
                                    solveBtn.setAttribute('data-ref', id);
                                    solveBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let solveBtnCell = row.insertCell(8);
                                    solveBtnCell.style.verticalAlign = 'middle';
                                    solveBtnCell.appendChild(solveBtn);

                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillSolvedTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            let projects = snapshot.val();
            let table = document.getElementById('solved-table');

            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    let project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        let ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.T_SOL) {
                                setTimeout(function () {
                                    let refId = id;
                                    let complaint = ref[refId];
                                    let row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    // row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(3).innerHTML = complaint.name;
                                    row.insertCell(4).innerHTML = complaint.gsDivision;
                                    // row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(5).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(6).innerHTML = complaint.significance;

                                    let moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let moreDetailsBtnCell = row.insertCell(7);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                                    let approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Accept';
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);

                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));
                                    let approveBtnCell = row.insertCell(8);
                                    approveBtnCell.style.verticalAlign = 'middle';

                                    approveBtnCell.appendChild(approveBtn);
                                    let rejectBtn = document.createElement('input');
                                    rejectBtn.type = 'button';
                                    rejectBtn.className = 'btn btn-danger';
                                    rejectBtn.value = 'Reject';
                                    rejectBtn.setAttribute('data-toggle', 'modal');
                                    rejectBtn.setAttribute('data-target', '#reject-form');
                                    rejectBtn.setAttribute('data-project', project);

                                    rejectBtn.setAttribute('data-ref', id);
                                    rejectBtn.addEventListener('click', (e) => fillForm(e.target));
                                    let rejectBtnCell = row.insertCell(9);

                                    rejectBtnCell.style.verticalAlign = 'middle';
                                    rejectBtnCell.appendChild(rejectBtn);
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
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            let projects = snapshot.val();
            let table = document.getElementById('rejected-table');

            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    let project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        let ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.E_REJ) {
                                setTimeout(function () {
                                    let refId = id;
                                    let complaint = ref[refId];
                                    let row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    // row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(3).innerHTML = complaint.name;
                                    row.insertCell(4).innerHTML = complaint.gsDivision;
                                    // row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(5).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(6).innerHTML = complaint.significance;

                                    let moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let moreDetailsBtnCell = row.insertCell(7);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                                    let solveBtn = document.createElement('input');
                                    solveBtn.type = 'button';
                                    solveBtn.className = 'btn btn-success';
                                    solveBtn.value = 'Instruction';
                                    solveBtn.setAttribute('data-toggle', 'modal');
                                    solveBtn.setAttribute('data-target', '#solve-form');
                                    solveBtn.setAttribute('data-project', project);
                                    solveBtn.setAttribute('data-ref', id);
                                    solveBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let solveBtnCell = row.insertCell(8);
                                    solveBtnCell.style.verticalAlign = 'middle';
                                    solveBtnCell.appendChild(solveBtn);

                                    let approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Accept';
                                    approveBtn.disabled = complaint.state == State.C_APP || complaint.state == State.E_APP;
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);
                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let approveBtnCell = row.insertCell(9);
                                    approveBtnCell.style.verticalAlign = 'middle';
                                    approveBtnCell.appendChild(approveBtn);
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
            let projects = snapshot.val();
            let table = document.getElementById('approved-table');

            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }

            if (!projects) {
                return;
            }

            for (let key in projects) {
                setTimeout(function () {
                    let project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        let ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.E_APP) {
                                setTimeout(function () {
                                    let refId = id;
                                    let complaint = ref[refId];
                                    let row = table.insertRow(-1);
                                    row.insertCell(0).innerHTML = project;
                                    row.insertCell(1).innerHTML = refId;
                                    row.insertCell(2).innerHTML = complaint.date;
                                    // row.insertCell(3).innerHTML = complaint.nicNo;
                                    row.insertCell(3).innerHTML = complaint.name;
                                    row.insertCell(4).innerHTML = complaint.gsDivision;
                                    // row.insertCell(6).innerHTML = complaint.phoneNo;
                                    row.insertCell(5).innerHTML = complaint.categoryOfGrievance;
                                    row.insertCell(6).innerHTML = complaint.significance;
                                    row.insertCell(7).innerHTML = complaint.actionTakenBy;

                                    let moreDetailsBtn = document.createElement('input');
                                    moreDetailsBtn.type = 'button';
                                    moreDetailsBtn.className = 'btn btn-info';
                                    moreDetailsBtn.value = 'More Details';
                                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                                    moreDetailsBtn.setAttribute('data-project', project);
                                    moreDetailsBtn.setAttribute('data-ref', id);
                                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let moreDetailsBtnCell = row.insertCell(8);
                                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                                    moreDetailsBtnCell.appendChild(moreDetailsBtn);
                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillProjectCombo() {
    db.child('project').on('value', function (snapshot) {
        $('[name=sc-project-name]').find('option').remove()
        $('[name=nc-project-name]').find('option').remove()
        let project = snapshot.val();

        for (let name in project) {
            $('[name=sc-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
            $('[name=nc-project-name]').append($('<option>', {
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
    let project = target.getAttribute('data-project');
    let ref = target.getAttribute('data-ref');
    db.child('complaint').child(project).child(ref).once('value', function (snapshot) {
        let complaint = snapshot.val();
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
            $('[name=cont-solution]').val(complaint.contractorSolution);
            let url = 'slider.html?project=' + project + '&ref=' + ref + '&type=';
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

            if(complaint.state == State.E_REJ){
                $('div.rejected-content').show();
                $('[name=reason-to-reject]').val(complaint.reasonToReject);
            }else{
                $('div.rejected-content').hide();
            }
        }
    });
}

function fillCatOfGrievance() {
    db.child('grievance-category').once('value').then(function (snapshot) {
        if (snapshot.val()) {
            for (let category in snapshot.val()) {
                let div = $("<div>", {
                    class: "checkbox"
                });
                let label = $("<label>");
                let input = $('<input />', {
                    type: "checkbox",
                    name: "category-grievance",
                    value: category
                });
                label.append(input);
                label.append(category);
                div.append(label);
                $('#cat-of-gri').append(div);
            }
        }
    })
}

function getSelectedCategoriesOfGrievance() {
    let selected = [];
    let arr = $('[name=category-grievance]');
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].checked) {
            selected.push(arr[i].value);
        }
    }
    return selected;
}

function clearComplaintForm() {
    $('[name=nc-project-name]').select(0);
    $('[name=nc-ref-no]').val('');
    $('[name=nc-date]').val('');
    $('[name=nc-name]').val('');
    $('[name=nc-address]').val('');
    $('[name=nc-gs-division]').val('');
    $('[name=nc-phone-no]').val('');
    $('[name=nc-nic-no]').val('');
    $('[name=nc-nature-grievance]').val('');
    $('[name=nc-significance]').select("Low");
    $('[name=nc-action-taken-by]').select("NON");
    $('[name=nc-action]').val('');
    $('[name=nc-date-reported]').val('');
    $('[name=nc-photo]').val("");
    let arr = $('[name=category-grievance]');
    for (let i = 0; i < arr.length; i++) {
        arr[i].checked = false;
    }
}

function sendEmail(email) {
    console.log(email);
    emailjs.send("gmail", "template", {
        "toEmail": email.email,
        "name": email.name,
        "message": email.message
    })
}

fillProjectCombo();
fillPendingTable();
fillSolvedTable();
fillRejectedTable();
fillApprovedTable();
