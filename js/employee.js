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
        $('[name=new-project-name]').val('');
        $('[name=new-pd-name]').val('');
        $('[name=new-dpd-name]').val('');
        alert('Project Created Successfully :)');
    }).catch(function (err) {
        alert('Unable to create :{');
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
            alert('You already registered a complaint under this reference number');
            $('#new-complaint-submit').attr('disabled', false);
        } else {
            db.child('complaint').child(projectName).child(refNo).set(complaint).then(function () {
                let files = $('[name=nc-photo]').get(0).files;
                if (files.length > 0) {
                    let fileRef = [];
                    let count = 0;
                    for (let index = 0; index < files.length; index++) {
                        let file = files[index];
                        fileRef.push(file.name);
                        firebase.storage().ref().child(projectName).child(refNo).child('employee').child(file.name).put(file).on('state_changed', function (snapshot) {
                        }, function (error) {
                            alert(error.message);
                        }, function () {
                            if (++count == files.length) {
                                db.child('project-assign').child(projectName).once('value', function (snapshot) {
                                    let users = snapshot.val();
                                    for (let userId in users) {
                                        if (users[userId].designation == "Consultant") {
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
                } else {
                    db.child('project-assign').child(projectName).once('value', function (snapshot) {
                        let users = snapshot.val();
                        for (let userId in users) {
                            if (users[userId].designation == "Consultant") {
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
    })
});

$('form#edit-complaint-form').on('submit', function (e) {

    e.preventDefault();
    let projectName = $('[name=ed-project-name]').val();
    let refNo = $('[name=ed-ref-no]').val();
    let date = $('[name=ed-date]').val();
    let name = $('[name=ed-name]').val();
    let address = $('[name=ed-address]').val();
    let gsDivision = $('[name=ed-gs-division]').val();
    let phoneNo = $('[name=ed-phone-no]').val();
    let nicNo = $('[name=ed-nic-no]').val();
    let natureOfGrievance = $('[name=ed-nature-grievance]').val();
    let significance = $('[name=ed-significance]').val();
    let categoryOfGrievance = getSelectedEditCategoriesOfGrievance();
    let actionTakenBy = $('[name=ed-action-taken-by]').val();
    let action = $('[name=ed-action]').val();
    let dateReported = $('[name=ed-date-reported]').val();
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

    if (confirm("This action cannot be recovered. Do you want to continue?")) {
        $('#ed-complaint-submit').attr('disabled', true);
        db.child('complaint').child(projectName).child(refNo).set(complaint).then(function () {
            db.child('project-assign').child(projectName).once('value', function (snapshot) {
                let users = snapshot.val();
                for (let userId in users) {
                    if (users[userId].designation == "Consultant") {
                        let user = users[userId];
                        let email = {};
                        email.email = user.email;
                        email.name = user.name;
                        email.message = projectName + " holding the reference number " + refNo + " is modified by the administrator. We're looking forward for your immediate action.";
                        sendEmail(email);
                    }
                }
            });
            alert('Complaint has been edited successfully : )');
            $('#ed-complaint-submit').attr('disabled', false);
        }).catch(function (e) {
            alert(e.message);
            $('#ed-complaint-submit').attr('disabled', false);
        });
    }
});

$('form#new-user-form').on('submit', function (e) {
    e.preventDefault();

    let name = $('[name=nu-name]').val();
    let nic = $('[name=nu-nic]').val();
    let address = $('[name=nu-address]').val();
    let mobileNo = $('[name=nu-mobile-no]').val();
    let designation = $('[name=nu-designation]').val();
    let email = $('[name=nu-email]').val();
    let password = $('[name=nu-password]').val();

    let user = {
        name,
        nic,
        address,
        mobileNo,
        designation,
        email
    };

    firebase.auth().createUserWithEmailAndPassword(email, password).then(function (res) {

        let userId = res.uid;

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

    let state = $('[name=sc-state]').val();
    let startDate = new Date($('[name=start-date]').val()).getTime();
    let endDate = new Date($('[name=end-date]').val()).getTime();
    console.log(startDate, endDate);

    let body = [];
    body.push(['Project', 'Ref No', 'Date', 'Name', 'Address', 'GN Division', 'Nature of Grievance', 'Category of grievance', 'Significance', 'Reported By', 'Action', 'Date Reported', 'Consultant Solution', 'Contractor Solution']);
    db.child('complaint').once('value').then((snapshot) => {
        let projects = snapshot.val();
        for (let project in projects) {
            for (let refNo in projects[project]) {
                let complaint = projects[project][refNo];
                if (complaint.state == state) {
                    let complaintDate = new Date(complaint.date).getTime()
                    if (complaintDate >= startDate && complaintDate <= endDate) {
                        body.push([
                            project,
                            refNo,
                            complaint.date,
                            complaint.name,
                            complaint.address,
                            complaint.gsDivision,
                            complaint.natureOfGrievance,
                            complaint.categoryOfGrievance ? complaint.categoryOfGrievance : [],
                            complaint.significance,
                            complaint.actionTakenBy,
                            complaint.action,
                            complaint.dateReported,
                            complaint.consultantSolution,
                            complaint.contractorSolution]);
                    }
                }
            }
        }
        let title = 'Employee Complaint System\nSummary of ' + ($("[name=sc-state] option:selected").text() + ' Complaints\n' + new Date().toDateString());
        tableReport(title, body, 'landscape', 'A3');
    })

});

$('form#single-report').on('submit', function (e) {
    e.preventDefault();
    let projectname = $('[name=sr-project-name]').val();
    let refNo = $('[name=sr-ref-no]').val();
    db.child('complaint').child(projectname).child(refNo).once('value', function (snapshot) {
        let complaint = snapshot.val();
        if (complaint) {
            generateReport(projectname, refNo, complaint)
        }
    });

});

$('form#approved-complaint-form').on('submit', function (e) {
    e.preventDefault();

    let projectName = $('[name=project-name]').val();
    let refNo = $('[name=ref-no]').val();

    let closedOutBy = user.uid;
    let dateReported = $('[name=ap-date-reported]').val();
    let dateClosed = $('[name=ap-date-closed]').val();
    let furtherAction = $('[name=ap-further-action]').val();
    let actionTaken = $('[name=ap-action-taken]').val();
    let state = State.E_APP;

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

    let projectName = $('[name=project-name]').val();
    let refNo = $('[name=ref-no]').val();

    let reasonToReject = $('[name=rj-reason]').val();
    let state = State.E_REJ;

    db.child('complaint').child(projectName).child(refNo).update({
        reasonToReject,
        state
    }).then(function () {
        db.child('project-assign').child(projectName).once('value', function (snapshot) {
            let users = snapshot.val();
            for (let userId in users) {
                if (users[userId].designation == "Consultant") {
                    let user = users[userId];
                    let email = {};
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

$('[name=ed-project-name]').on('change', function () {
    let projectname = $('[name=ed-project-name]').val();
    db.child('complaint').child(projectname).once('value').then(function (snapshot) {
        $('[name=ed-ref-no]').find('option').remove()
        if (snapshot.exists()) {
            for (let refNo in snapshot.val()) {
                $('[name=ed-ref-no]').append($('<option>', {
                    val: refNo,
                    text: refNo
                }));
            }
            $('[name=ed-ref-no]').trigger('change');
        }
    });

});

$('[name=sr-project-name]').on('change', function () {
    let projectname = $('[name=sr-project-name]').val();
    db.child('complaint').child(projectname).once('value').then(function (snapshot) {
        $('[name=sr-ref-no]').find('option').remove()
        if (snapshot.exists()) {
            for (let refNo in snapshot.val()) {
                $('[name=sr-ref-no]').append($('<option>', {
                    val: refNo,
                    text: refNo
                }));
            }
        }
    });

});

$('[name=ed-ref-no]').on('change', function () {
    let projectname = $('[name=ed-project-name]').val();
    let refNo = $('[name=ed-ref-no]').val();
    $('div#ed-cat-of-gri').empty();
    db.child('complaint').child(projectname).child(refNo).once('value', function (snapshot) {
        let complaint = snapshot.val();
        if (complaint) {
            $('[name=ed-name]').val(complaint.name);
            $('[name=ed-nic-no]').val(complaint.nicNo);
            $('[name=ed-date]').val(complaint.date);
            $('[name=ed-address]').val(complaint.address);
            $('[name=ed-gs-division]').val(complaint.gsDivision);
            $('[name=ed-phone-no]').val(complaint.phoneNo);
            $('[name=ed-nature-grievance]').val(complaint.natureOfGrievance);
            $('[name=ed-significance]').val(complaint.significance);
            $('[name=ed-action-taken-by]').val(complaint.actionTakenBy);
            $('[name=ed-action]').val(complaint.action);
            $('[name=ed-date-reported]').val(complaint.dateReported);
            db.child('grievance-category').once('value').then(function (snapshot) {
                if (snapshot.val()) {
                    for (let category in snapshot.val()) {
                        let div = $("<div>", {
                            class: "checkbox"
                        });
                        let label = $("<label>");
                        let input = $('<input />', {
                            type: "checkbox",
                            name: "ed-category-grievance",
                            value: category,
                            checked: complaint.categoryOfGrievance.indexOf(category) != -1
                        });
                        label.append(input);
                        label.append(category);
                        div.append(label);
                        $('#ed-cat-of-gri').append(div);
                    }
                }
            })
        }
    });
});

$('#show-summary-btn').on('click', function () {
    let statesCount = [0, 0, 0, 0, 0, 0, 0];
    db.child('complaint').once('value').then((snapshot) => {
        let projects = snapshot.val();
        for (let project in projects) {
            for (let refNo in projects[project]) {
                let complaint = projects[project][refNo];
                statesCount[complaint.state]++;
            }
        }
        let body = [['State of the complaint', 'No of complaints'],
            ['Pending', statesCount[0]],
            ['Employer\'s Accepted/ Solved', statesCount[2]],
            ['Employer\'s Rejected', statesCount[1]],
            ['Consultant Accepted', statesCount[4]],
            ['Consultant Rejected', statesCount[3]]];

        tableReport('Summary', body, 'portrait' ,'A4');
    })
});

$('#single-summary-report').on('submit', function (e) {
    e.preventDefault();
    let projectname = $('[name=ssr-project-name]').val();
    let statesCount = [0, 0, 0, 0, 0, 0, 0];
    db.child('complaint').once('value').then((snapshot) => {
        let projects = snapshot.val();
        for (let project in projects) {
            if(project == projectname){
                for (let refNo in projects[project]) {
                    let complaint = projects[project][refNo];
                    statesCount[complaint.state]++;
                }
            }
        }
        let body = [['State of the complaint', 'No of complaints'],
            ['Pending', statesCount[0]],
            ['Employer\'s Accepted/ Solved', statesCount[2]],
            ['Employer\'s Rejected', statesCount[1]],
            ['Consultant Accepted', statesCount[4]],
            ['Consultant Rejected', statesCount[3]]];

        tableReport('Summary', body, 'portrait' ,'A4');
    })
});

function fillCatGrievanceTable() {
    db.child('grievance-category').on('value', function (snapshot) {
        let table = document.getElementById('cat-gr-table');

        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }

        for (let key in snapshot.val()) {
            let rowData = table.insertRow(-1);
            rowData.insertCell(0).innerHTML = key;
            let btn = document.createElement('input');
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
                            if (ref[id].state != State.E_REJ && ref[id].state != State.E_APP && ref[id].state != State.C_APP) {
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

                                    let remindBtn = document.createElement('input');
                                    remindBtn.type = 'button';
                                    remindBtn.className = 'btn btn-success';
                                    remindBtn.value = 'Remind';
                                    remindBtn.setAttribute('data-project', project);
                                    remindBtn.setAttribute('data-ref', id);
                                    remindBtn.addEventListener('click', (e) => remindConsultant(e.target));

                                    let remindBtnCell = row.insertCell(9);
                                    remindBtnCell.style.verticalAlign = 'middle';
                                    remindBtnCell.appendChild(remindBtn);
                                }, 0);
                            }
                        }
                    })
                }, 0);
            }
        });
    }, 2000);
}

function fillApproveRejectTable() {
    setTimeout(function () {
        db.child('project-assign-user').child(user.uid).once('value', function (snapshot) {
            let projects = snapshot.val();
            let table = document.getElementById('approve-reject-table');
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
                            if (ref[id].state == State.C_APP) {
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

                                    let approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Accept';
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);
                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));

                                    let approveBtnCell = row.insertCell(9);
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

                                    let rejectBtnCell = row.insertCell(10);
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
                    db.child('complaint').child(project).on('value', function (complaints) {
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

                                    let approveBtn = document.createElement('input');
                                    approveBtn.type = 'button';
                                    approveBtn.className = 'btn btn-danger';
                                    approveBtn.value = 'Accept';
                                    approveBtn.disabled = complaint.state == State.E_APP;
                                    approveBtn.setAttribute('data-toggle', 'modal');
                                    approveBtn.setAttribute('data-target', '#approved-form');
                                    approveBtn.setAttribute('data-project', project);
                                    approveBtn.setAttribute('data-ref', id);

                                    approveBtn.addEventListener('click', (e) => fillForm(e.target));
                                    let approveBtnCell = row.insertCell(9);
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
        let table = document.getElementById('user-table');
        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }
        users = snapshot.val();
        for (let key in users) {
            let user = users[key];
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
        let table = document.getElementById('project-table');
        while (table.rows.length > 1) {
            table.deleteRow(-1);
        }
        projects = snapshot.val();
        for (let key in projects) {
            let project = projects[key];
            rowData = table.insertRow(-1);
            rowData.insertCell(0).innerHTML = key;
            rowData.insertCell(1).innerHTML = project.pdName;
            rowData.insertCell(2).innerHTML = project.dpdName;
            let btn = document.createElement('input');
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
        $('[name=ed-project-name]').find('option').remove()
        $('[name=sr-project-name]').find('option').remove()
        $('[name=ssr-project-name]').find('option').remove()

        let project = snapshot.val();

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
            $('[name=ed-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
            $('[name=sr-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
            $('[name=ssr-project-name]').append($('<option>', {
                val: name,
                text: name
            }));
        }
        $('[name=ed-project-name]').trigger('change');
        $('[name=sr-project-name]').trigger('change');
    });
}

function fillNatureOfGrievance() {
    db.child('grievance-category').on('value', function (snapshot) {
        $('[name=nc-grievance]').find('option').remove();

        let grivance = snapshot.val();

        for (let name in grivance) {
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

function remindConsultant(target) {
    let project = target.getAttribute('data-project');
    let message = prompt('Plese enter a message to sent to the consultant/s');
    db.child('project-assign').child(project).once('value', function (snapshot) {
        let users = snapshot.val();
        for (let userId in users) {
            if (users[userId].designation == "Consultant") {
                let user = users[userId];
                let email = {};
                email.email = user.email;
                email.name = user.name;
                email.message = message;
                sendEmail(email);
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

function getSelectedEditCategoriesOfGrievance() {
    let selected = [];
    let arr = $('[name=ed-category-grievance]');
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

function tableReport(title, body, pageOrientation, pageSize) {
    let definition = {
        pageSize: pageSize,
        pageOrientation: pageOrientation,
        content: [
            {text: title, style: 'header'},

            {
                table: {
                    body: body
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            }

        }
    }
    pdfMake.createPdf(definition).open({}, window);
}

function generateReport(proect, refNo, complaint) {
    var definition = {
        pageSize: 'A4',
        content: [
            {text: 'Employee Complaint System', style: 'header'},
            {text: 'Report for a single complaint'},
            {
                columns: [
                    {
                        width: 150,
                        text: 'Project'
                    },
                    {
                        width: '*',
                        text: proect
                    }
                ],
                columnGap: 5,
                margin: [0, 20, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Ref No'
                    },
                    {
                        width: '*',
                        text: refNo
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Date'
                    },
                    {
                        width: '*',
                        text: complaint.date
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Name'
                    },
                    {
                        width: '*',
                        text: complaint.name
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Address'
                    },
                    {
                        width: '*',
                        text: complaint.address
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'GN Division'
                    },
                    {
                        width: '*',
                        text: complaint.gsDivision
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'NIC No'
                    },
                    {
                        width: '*',
                        text: complaint.nicNo
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Phone No'
                    },
                    {
                        width: '*',
                        text: complaint.phoneNo
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Nature of Grievance'
                    },
                    {
                        width: '*',
                        text: complaint.natureOfGrievance
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Category of grievance'
                    },
                    {
                        width: '*',
                        ol: complaint.categoryOfGrievance
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Significance'
                    },
                    {
                        width: '*',
                        text: complaint.significance
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Reported By'
                    },
                    {
                        width: '*',
                        text: complaint.actionTakenBy
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Action'
                    },
                    {
                        width: '*',
                        text: complaint.action
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Date Reported'
                    },
                    {
                        width: '*',
                        text: complaint.dateReported
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Consultant Solution'
                    },
                    {
                        width: '*',
                        text: complaint.consultantSolution
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
            {
                columns: [
                    {
                        width: 150,
                        text: 'Contractor Solution'
                    },
                    {
                        width: '*',
                        text: complaint.contractorSolution
                    }
                ],
                columnGap: 5,
                margin: [0, 5, 0, 0]
            },
        ],

        styles: {
            header: {
                fontSize: 22,
                bold: true
            }
        }
    };
    pdfMake.createPdf(definition).open({}, window);

}

fillNatureOfGrievance();
fillProjectCombo();
fillCatGrievanceTable();
fillUserTable();
fillProjectTable();
fillPendingTable();
fillApproveRejectTable();
fillApprovedTable();
fillRejectedTable();
fillCatOfGrievance();
