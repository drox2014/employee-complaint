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
        if (!user) {
            return window.location = 'index.html'
        }
        $('body').fadeIn(0);
        emailjs.init("user_f5gjxUk9bUuqdRhBgTjYa");
    }, 1500);
});

$('form#new-project-form').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=new-project-name]').val();
    var pdName = $('[name=new-pd-name]').val();
    var dpdName = $('[name=new-dpd-name]').val();

    db.child('project').child(projectName).set({
        pdName,
        dpdName
    }).then(function (res) {
        alert('Project Created Successfully :)')
    }).catch(function (err) {
        alert('Unable to create :{')
    })
});

$('form#new-grievance-category-form').on('submit', function (e) {
    e.preventDefault();

    var grievanceName = $('[name=new-grievance-name]').val();

    db.child('grievance-category').child(grievanceName).set({
        grievanceName
    }).then(function (res) {
        alert('New Grievance Category is created Successfully :)');
        $('[name=new-grievance-name]').val("");
    }).catch(function (err) {
        alert('Unable to create :{')
    })
});

$('form#new-complaint-form').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=nc-project-name]').val();
    var refNo = $('[name=nc-ref-no]').val();
    var date = $('[name=nc-date]').val();
    var name = $('[name=nc-name]').val();
    var address = $('[name=nc-address]').val();
    var gsDivision = $('[name=nc-gs-division]').val();
    var phoneNo = $('[name=nc-phone-no]').val();
    var nicNo = $('[name=nc-nic-no]').val();
    var natureOfGrievance = $('[name=nc-nature-grievance]').val();
    var significance = $('[name=nc-significance]').val();
    var categoryOfGrievance = $('[name=nc-grievance]').val();
    var actionTakenBy = $('[name=nc-action-taken-by]').val();
    var action = $('[name=nc-action]').val();
    var dateReported = $('[name=nc-date-reported]').val();
    var closedOutBy = "";
    var dateClosed = "";
    var furtherAction = "";
    var actionTaken = "";
    var consultantSolution = "";
    var contractorSolution = "";
    var state = "";

    if (actionTakenBy == "NON") {
        state = State.NEW;
    } else {
        state = State.C_SOL;
    }

    var complaint = {
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

    db.child('complaint').child(projectName).child(refNo).set(complaint).then(function () {
            var files = $('[name=nc-photo]').get(0).files;
            var fileRef = [];
            for (var index = 0; index < files.length; index++) {
                var file = files[index];
                fileRef.push(file.name);
                firebase.storage().ref().child(projectName).child(refNo).child('employee').child(file.name).put(file);
            }
            db.child('project-assign').child(projectName).once('value', function (snapshot) {
                var users = snapshot.val();
                for (let userId in users) {
                    if (users[userId].designation == "Consultant") {
                        var user = users[userId];
                        var email = {};
                        email.email = user.email;
                        email.name = user.name;
                        email.message = "You have received a new complaint from " + projectName + " holding the reference number " + refNo + ". We're looking forward for your immediate action.";
                        sendEmail(email);
                    }
                }
            });
            db.child('image-ref').child(projectName).child(refNo).child('employee').set({fileRef});
            alert('Complaint has been submitted successfully : )');
        }).catch(function (e) {
            alert(e.message);
        })
    }).catch(function (e) {
        alert(e.message);
    })
});

$('form#new-user-form').on('submit', function (e) {
    e.preventDefault();

    var name = $('[name=nu-name]').val();
    var nic = $('[name=nu-nic]').val();
    var address = $('[name=nu-address]').val();
    var mobileNo = $('[name=nu-mobile-no]').val();
    var designation = $('[name=nu-designation]').val();
    var email = $('[name=nu-email]').val();
    var password = $('[name=nu-password]').val();

    var user = {
        name,
        nic,
        address,
        mobileNo,
        designation,
        email
    };

    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (res) {

        var userId = res.uid;

        db.child('user').child(userId).set(user).then(function () {
            alert('User has been created successfully : )')
            $('[name=nu-name]').val("");
            $('[name=nu-nic]').val("");
            $('[name=nu-address]').val("");
            $('[name=nu-mobile-no]').val("");
            $('[name=nu-email]').val("");
            $('[name=nu-password]').val("");
        }).catch(function (e) {
            alert(e.message);
        });
    }).catch(function (error) {
        return alert(error.message);
    });
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

$('form#search-complaints').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=sc-project-name]').val();
    var table = document.getElementById('result-table');

    while (table.rows.length > 1) {
        table.deleteRow(-1);
    }

    db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
        var projects = snapshot.val();
        if (!projects) {
            return;
        }
        if (projects.hasOwnProperty(projectName)) {
            db.child('complaint').child(projectName).once('value', function (complaints) {
                var ref = complaints.val();
                for (let id in ref) {
                    var refId = id;
                    var complaint = ref[refId];
                    var row = table.insertRow(-1);
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

                    var moreDetailsBtn = document.createElement('input');
                    moreDetailsBtn.type = 'button';
                    moreDetailsBtn.className = 'btn btn-info';
                    moreDetailsBtn.value = 'More Details';
                    moreDetailsBtn.setAttribute('data-toggle', 'modal');
                    moreDetailsBtn.setAttribute('data-target', '#more-details-form');
                    moreDetailsBtn.setAttribute('data-project', projectName);
                    moreDetailsBtn.setAttribute('data-ref', id);
                    moreDetailsBtn.addEventListener('click', (e) => fillForm(e.target));

                    var moreDetailsBtnCell = row.insertCell(10);
                    moreDetailsBtnCell.style.verticalAlign = 'middle';
                    moreDetailsBtnCell.appendChild(moreDetailsBtn);

                    var approveBtn = document.createElement('input');
                    approveBtn.type = 'button';
                    approveBtn.className = 'btn btn-danger';
                    approveBtn.value = 'Approve';
                    approveBtn.disabled = complaint.state == State.E_APP;
                    approveBtn.setAttribute('data-toggle', 'modal');
                    approveBtn.setAttribute('data-target', '#approved-form');
                    approveBtn.setAttribute('data-project', projectName);
                    approveBtn.setAttribute('data-ref', id);
                    approveBtn.addEventListener('click', (e) => fillForm(e.target));

                    var approveBtnCell = row.insertCell(11);
                    approveBtnCell.style.verticalAlign = 'middle';
                    approveBtnCell.appendChild(approveBtn);

                    var rejectBtn = document.createElement('input');
                    rejectBtn.type = 'button';
                    rejectBtn.className = 'btn btn-danger';
                    rejectBtn.value = 'Reject';
                    rejectBtn.disabled = complaint.state == State.E_APP;
                    rejectBtn.setAttribute('data-toggle', 'modal');
                    rejectBtn.setAttribute('data-target', '#reject-form');
                    rejectBtn.setAttribute('data-project', projectName);
                    rejectBtn.setAttribute('data-ref', id);
                    rejectBtn.addEventListener('click', (e) => fillForm(e.target));

                    var rejectBtnCell = row.insertCell(12);
                    rejectBtnCell.style.verticalAlign = 'middle';
                    rejectBtnCell.appendChild(rejectBtn);
                }
            });
        }
    });
});

$('form#approved-complaint-form').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=project-name]').val();
    var refNo = $('[name=ref-no]').val();

    var closedOutBy = user.uid;
    var dateReported = $('[name=ap-date-reported]').val();
    var dateClosed = $('[name=ap-date-closed]').val();
    var furtherAction = $('[name=ap-further-action]').val();
    var actionTaken = $('[name=ap-action-taken]').val();
    var state = State.E_APP;

    db.child('complaint').child(projectName).child(refNo).update({
        closedOutBy,
        dateClosed,
        dateReported,
        furtherAction,
        actionTaken,
        state
    }).then(function () {
        alert('Complaint was approved successfully :)');
    }).catch(function (e) {
        alert('Unable to approve the complaint, ' + e.message);
    });
});

$('form#reject-complaint-form').on('submit', function (e) {
    e.preventDefault();

    var projectName = $('[name=project-name]').val();
    var refNo = $('[name=ref-no]').val();

    var reasonToReject = $('[name=rj-reason]').val();
    var state = State.E_REJ;

    db.child('complaint').child(projectName).child(refNo).update({
        reasonToReject,
        state
    }).then(function () {
        db.child('project-assign').child(projectName).once('value', function (snapshot) {
            var users = snapshot.val();
            for (let userId in users) {
                if (users[userId].designation == "Consultant") {
                    var user = users[userId];
                    var email = {};
                    email.email = user.email;
                    email.name = user.name;
                    email.message = "Your solution for" + projectName + " with the reference number " + refNo + " was rejected. Please submit a new solution.";
                    sendEmail(email);
                }
            }
        });
        alert('Complaint was rejected successfully :)');
    }).catch(function (e) {
        alert('Unable to reject the complaint, ' + e.message);
    });
    $('[name=rj-close]').click();
});

function fillCatGrievanceTable() {
    db.child('grievance-category').on('value', function (snapshot) {
        var table = document.getElementById('cat-gr-table');

        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }

        for (var key in snapshot.val()) {
            var rowData = table.insertRow(-1);
            rowData.insertCell(0).innerHTML = key;
            var btn = document.createElement('input');
            btn.type = "button";
            btn.className = "btn btn-fill btn-danger";
            btn.value = "Delete";
            btn.onclick = function () {
                if (confirm('Do you want to continue?')) {
                    db.child('grievance-category').child(key).remove();
                }

            };
            rowData.insertCell(1).appendChild(btn);
        }
    })
}

function fillPendingTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('pending-table');
            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }
            if (!projects) {
                return;
            }
            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state != State.E_REJ && ref[id].state != State.E_APP) {
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

                                    var approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Approve';
                                    approveBtn.disabled = complaint.state == State.E_APP;
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);

                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));
                                    var approveBtnCell = row.insertCell(11);
                                    approveBtnCell.style.verticalAlign = 'middle';

                                    approveBtnCell.appendChild(approveBtn);
                                    var rejectBtn = document.createElement('input');
                                    rejectBtn.type = 'button';
                                    rejectBtn.className = 'btn btn-danger';
                                    rejectBtn.value = 'Reject';
                                    rejectBtn.disabled = complaint.state == State.E_APP;
                                    rejectBtn.setAttribute('data-toggle', 'modal');
                                    rejectBtn.setAttribute('data-target', '#reject-form');
                                    rejectBtn.setAttribute('data-project', project);

                                    rejectBtn.setAttribute('data-ref', id);
                                    rejectBtn.addEventListener('click', (e) => fillForm(e.target));
                                    var rejectBtnCell = row.insertCell(12);

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

function fillApprovedTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('approved-table');
            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }
            if (!projects) {
                return;
            }
            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.E_APP) {
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
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillRejectedTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            var projects = snapshot.val();
            var table = document.getElementById('rejected-table');
            while (table.rows.length > 1) {
                table.deleteRow(-1);
            }
            if (!projects) {
                return;
            }
            for (let key in projects) {
                setTimeout(function () {
                    var project = key;
                    db.child('complaint').child(project).once('value', function (complaints) {
                        var ref = complaints.val();
                        for (let id in ref) {
                            if (ref[id].state == State.E_REJ) {
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

                                    var approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Approve';
                                    approveBtn.disabled = complaint.state == State.E_APP;
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);

                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));
                                    var approveBtnCell = row.insertCell(11);
                                    approveBtnCell.style.verticalAlign = 'middle';
                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillUserTable() {
    db.child('user').on('value', function (snapshot) {
        var table = document.getElementById('user-table');
        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }
        users = snapshot.val();
        for (var key in users) {
            var user = users[key];
            rowData = table.insertRow(-1);
            rowData.insertCell(0).innerHTML = user.name;
            rowData.insertCell(1).innerHTML = user.nic;
            rowData.insertCell(2).innerHTML = user.address;
            rowData.insertCell(3).innerHTML = user.mobileNo;
            if (user.designation == "ADMIN") {
                rowData.insertCell(4).innerHTML = 'Admin';
            } else if (user.designation == "CONTR") {
                rowData.insertCell(4).innerHTML = 'Contractor';
            } else {
                rowData.insertCell(4).innerHTML = 'Consultant';
            }
            rowData.insertCell(5).innerHTML = user.email;
        }
    })
}

function fillProjectTable() {
    db.child('project').on('value', function (snapshot) {
        var table = document.getElementById('project-table');
        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }
        projects = snapshot.val();
        for (var key in projects) {
            var project = projects[key];
            rowData = table.insertRow(-1);
            rowData.insertCell(0).innerHTML = key;
            rowData.insertCell(1).innerHTML = project.pdName;
            rowData.insertCell(2).innerHTML = project.dpdName;
            var btn = document.createElement('input');
            btn.className = "btn btn-danger";
            btn.value = "Delete";
            btn.type = "button";
            btn.onclick = function () {
                if (confirm('Do you want to continue?')) {
                    db.child('project').child(key).remove();
                }
            };
            rowData.insertCell(3).appendChild(btn);
        }
    })
}

function fillProjectCombo() {
    db.child('project').on('value', function (snapshot) {
        $('[name=nc-project-name]').find('option').remove()
        $('[name=nu-project-name]').find('option').remove()
        $('[name=sc-project-name]').find('option').remove()

        var project = snapshot.val();

        for (let name in project) {
            $('[name=nc-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
            $('[name=nu-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
            $('[name=sc-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
        }
        // $('[name=sc-project-name]').trigger('change');
    });
}

function fillNatureOfGrievance() {
    db.child('grievance-category').on('value', function (snapshot) {
        $('[name=nc-grievance]').find('option').remove();

        var grivance = snapshot.val();

        for (var name in grivance) {
            $('[name=nc-grievance]').append($('<option>', {
                val: name,
                text: name
            }));
        }
    })
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
            $('[name=cont-solution]').val(complaint.contractorSolution);
            var url = 'slider.html?project=' + project + '&ref=' + ref + '&type=';
            $('[name=employee-link]').attr('href', url + 'employee');
            $('[name=consultant-link]').attr('href', url + 'consultant');
            $('[name=contractor-link]').attr('href', url + 'contractor');

            if (complaint.state == State.E_APP) {
                $('div.approved-content').show();
                $('[name=date-reported]').val(complaint.dateReported);
                $('[name=date-closed]').val(complaint.dateClosed);
                $('[name=further-action]').val(complaint.furtherAction);
                $('[name=action-taken ]').val(complaint.actionTaken);
            } else {
                $('div.approved-content').hide();
            }

            if (complaint.state == State.E_REJ) {
                $('div.rejected-content').show();
                $('[name=reason-to-reject]').val(complaint.reasonToReject);
            } else {
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

fillNatureOfGrievance();
fillProjectCombo();
fillCatGrievanceTable();
fillUserTable();
fillProjectTable();
fillPendingTable();
fillApprovedTable();
fillRejectedTable();
