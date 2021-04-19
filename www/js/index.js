document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    applyDeviceData();
    checkConnection();

    navigator.geolocation.watchPosition(geolocationSuccess,geolocationError);
    window.addEventListener("batterystatus", onBatteryStatus, false);
    
    $("#camera-btn").click(getPicutre);
    $("#addPicture").click(sendPictureRequest);
}

function applyDeviceData() {
    $("#cordovaVersion").text(device.cordova);
    $("#manufacturer").text(device.manufacturer);
    $("#isVirtual").text(device.isVirtual);
    $("#deviceModel").text(device.model);

    $("#operatingSystem").text(device.platform);
    $("#osVersion").text(device.version);
    $("#uuid").text(device.uuid);
    $("#serial").text(device.serial);
}

function onBatteryStatus(status) {
    $("#batteryStatus").text(status.level);
    $("#isPlugged").text(status.isPlugged);
}

function checkConnection() {
    var networkState = navigator.connection.type;
    
    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';
    
    $("#connectionType").text(states[networkState]);
}

function geolocationSuccess(position) {
    $('#latitude-value').text(position.coords.latitude);
    $('#longitude-value').text(position.coords.longitude);
    $('#altitude-value').text(position.coords.altitude);
    $('#accuracy-value').text(position.coords.accuracy);
    $('#altitudeAccuracy-value').text(position.coords.altitudeAccuracy);
}

function geolocationError(error) {
    alert(error);    
}

//Picture

function getPicutre() {
    navigator.camera.getPicture(succeededCameraCallback, failedCameraCallback, {
        quality: 25,
        destinationType: Camera.DestinationType.DATA_URL
    });
}

function succeededCameraCallback(imageData) {
    $('#myImage').attr('src', 'data:image/jpeg;base64,' + imageData);
    $('#myImage').css('display', 'block');
    $('#myImage').show();
}

function failedCameraCallback(message) {
    alert(message);
}

function sendPictureRequest() {
    $.mobile.loading("show");

    let base64Img = $("#myImage").attr('src');
    let userName = $('#username').val();
    let password = $('#password').val();

    let requestData = {
        UserName: userName,
        Password: password,
        Picture: base64Img
    };

    console.log({ requestData });

    $.ajax({
        type: "PUT",
        url: baseSurviceUrl + "picture",
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(requestData),
        success: function() {
            $.mobile.loading("hide");
            alert("Successfully added!");
            loadDetailsPage();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            $.mobile.loading("hide");
            loadDetailsPage();
        }
    });
}

function loadHomePage() {
    const homePage = $("#page1");
    $.mobile.pageContainer.pagecontainer("change", homePage, {});
}

//kinvey 
function startApp() {
    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rJ87qhF8d";
    const kinveyAppSecret = "f9bf6ee5d978422c94d692958c8de626";
    const kinveyAppAuthHeaders = {
        "Authorization": "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewHome');

    $('#linkHome').click(showHomeView);
    $('#linkLogin').click(showLoginView);
    $('#linkRegister').click(showRegisterView);
    $('#linkListBooks').click(listBooks);
    $('#linkCreateBook').click(showCreateBookView);
    $('#linkLogout').click(logoutUser);

    $('#buttonLoginUser').click(loginUser);
    $('#buttonRegisterUser').click(registerUser);
    $('#buttonCreateBook').click(createBook);
    $('#buttonEditBook').click(editBook);

    $('#infoBox, #errorBox').click(function () {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function () {
            $('#loadingBox').show();
        },
        ajaxStop: function () {
            $('#loadingBox').hide();
        }
    });

    function showHideMenuLinks() {
        $('#linkHome').show();

        if(sessionStorage.getItem('authToken')) {
            $('#linkLogin').hide();
            $('#linkRegister').hide();
            $('#linkListBooks').show();
            $('#linkCreateBook').show();
            $('#linkLogout').show();
        } else {
            $('#linkLogin').show();
            $('#linkRegister').show();
            $('#linkListBooks').hide();
            $('#linkCreateBook').hide();
            $('#linkLogout').hide();
        }
    }
    
    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }
    
    function showHomeView() {
        showView('viewHome');
    }
    
    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }
    
    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }
    
    function showCreateBookView() {
        $('#formCreateBook').trigger('reset');
        showView('viewCreateBook');
    }
    
    function loginUser() {
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });

        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('Login successful.');
        }
    }
    
    function registerUser() {
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User registration successful.');
        }
    }
    
    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        $('#loggedInUser').text("Welcome, " + username + "!");
    }
    
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if(response.readyState === 0) {
            errorMsg = "Cannot connect due to network error.";
        }
        if(response.responseJSON && response.responseJSON.description) {
            errorMsg = response.responseJSON.description;
        }

        showError(errorMsg);
    }
    
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }
    
    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text('');
        showHideMenuLinks();
        showView('viewHome');
        showInfo('Logout successful.')
    }

    function listBooks() {
        $('#books').empty();
        showView('viewBooks');

        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            success: loadBooksSuccess,
            error: handleAjaxError
        });
        
        function loadBooksSuccess(books) {
            showInfo('Books loaded.');
            if(books.length == 0) {
                $('#books').text('No books in the library.');
            } else {
                let booksTable = $('<table>')
                    .append($('<tr>')
                        .append('<th>Title</th><th>Author</th>', '<th>Description</th><th>Actions</th>'));

                for(let book of books){
                    appendBookRow(book, booksTable);
                }

                $('#books').append(booksTable)
            }
            
            function appendBookRow(book, booksTable) {
                let links = [];
                if(book._acl.creator == sessionStorage['userId']) {
                    let deleteLink = $('<a href="#">[Delete]</a>').click(function () {
                        deleteBook(book);
                    });
                    let editLink = $('<a href="#">[Edit]</a>').click(function () {
                        loadBookForEdit(book);
                    });

                    links = [deleteLink, ' ', editLink];
                }

                booksTable.append($('<tr>')
                    .append($('<td>').text(book.title), $('<td>').text(book.author), $('<td>').text(book.description), $('<td>').append(links)
                    ));
            }
        }
    }
    
    function getKinveyUserAuthHeaders() {
        return {
            "Authorization": "Kinvey " + sessionStorage.getItem('authToken')
        };
    }
    
    function createBook() {
        let bookData = {
            title: $('#formCreateBook input[name=title]').val(),
            author: $('#formCreateBook input[name=author]').val(),
            description: $('#formCreateBook textarea[name=descr]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            data: bookData,
            success: createBookSuccess,
            error: handleAjaxError
        });

        function createBookSuccess(response) {
            listBooks();
            showInfo('Book created.');
        }
    }
    
    function loadBookForEdit(book) {
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + book._id,
            headers: getKinveyUserAuthHeaders(),
            success: loadBookForEditSuccess,
            error: handleAjaxError
        });

        function loadBookForEditSuccess(book) {
            $('#formEditBook input[name=id]').val(book._id);
            $('#formEditBook input[name=title]').val(book.title);
            $('#formEditBook input[name=author]').val(book.author);
            $('#formEditBook textarea[name=descr]').val(book.description);

            showView('viewEditBook');
        }
    }
    
    function editBook() {
        let bookData = {
            title: $('#formEditBook input[name=title]').val(),
            author: $('#formEditBook input[name=author]').val(),
            description: $('#formEditBook textarea[name=descr]').val()
        };

        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + $('#formEditBook input[name=id]').val(),
            headers: getKinveyUserAuthHeaders(),
            data: bookData,
            success: editBookSuccess,
            error: handleAjaxError
        });

        function editBookSuccess(response) {
            listBooks();
            showInfo('Book edited.');
        }
    }

    function deleteBook(book) {
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + book._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteBookSuccess,
            error: handleAjaxError
        });
        
        function deleteBookSuccess(response) {
            listBooks();
            showInfo('Book deleted.');
        }
    }
}