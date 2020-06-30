$(async function () {

  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");


  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;
  await checkIfLoggedIn();

  /**
 * Event listener for logging in.
 *  If successfully we will setup the user instance
 */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;

    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });


  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();

    loginAndSubmitForm();
    fillUserProfile();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", async function () {
    // empty out local storage
    localStorage.clear();

    //MYCODE: Clear username from the nav
    hideBarLinks();
    // refresh the page, clearing memory
    setTimeout(location.reload.bind(window.location), 1500);
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  //MYCODE: Functionality for bar link toggles. Hiding and showing forms
  function hideBarLinks() {
    $submitForm.slideUp(250);
    $ownStories.slideUp(250);
    $("#favorited-articles").slideUp(250);
    $("#user-profile").slideUp(250);
    $allStoriesList.slideUp(400);

    $("#nav-user-profile").addClass('hidden');
    $("#new-story").addClass('hidden');
    $("#favorites").addClass('hidden');
    $("#nav-all").addClass('hidden');
    $("#my-stories").addClass('hidden');
  }

  //click on "submit" new story
  $("#new-story").on("click", function () {
    if ($('#new-story').hasClass('hidden')) {
      $submitForm.slideDown(150);
      $('#new-story').toggleClass('hidden');
      $('#dimmer').addClass('body-shadow')

    }
  })

  $("#close-window").on("click", function () {
    $submitForm.slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');
  })

  $("#dimmer").on("click", function () {
    $submitForm.slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');
  })

  //click on "favorites"
  $("#favorites").on("click", async function () {
    $('#favorited-articles').html('');
    const user = await StoryList.getFavoritesHelper(localStorage.username);
    const favorites = user.data.user.favorites;

    for (let story of favorites) {
      const result = generateStoryHTML(story);
      result.children("span").html('<i class="fas fa-heart"></i>')
        .addClass('fav').removeClass('unfav');
      $('#favorited-articles').append(result);
    }

    $("i.fa-heart").on("click", async function (event) {
      favToggle(event);
      await favAppendOrRemove(event);
    });

    if ($("#favorites").hasClass('hidden')) {
      hideBarLinks();
      $("#favorited-articles").delay(350).slideDown(500);
      $("#favorites").toggleClass('hidden');
    }
    favPlaceHolder();

  })

  //click on "my stories"
  $("#my-stories").on("click", function () {
    if ($("#my-stories").hasClass('hidden')) {
      hideBarLinks();
      $ownStories.delay(350).slideDown(500);
      $("#my-stories").toggleClass('hidden');
    }
  })

  //click on "username"
  $("#nav-user-profile").on("click", function () {
    if ($('#user-profile').hasClass('hidden')) {
      hideBarLinks();
      $("#user-profile").delay(350).slideDown(500);
      $("#nav-user-profile").toggleClass('hidden');
    }
  })

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {

    if ($("#nav-all").hasClass('hidden')) {
      hideBarLinks();
      await generateStories();
      $allStoriesList.delay(150).slideDown(400)
      $("#nav-all").removeClass('hidden');
    }
  });

  //MYCODE: SUBMIT A NEW STORY
  $submitForm.on("submit", async function () {
    const author = $("#author").val();
    const title = $("#title").val();
    const url = $("#url").val();

    await StoryList.addStory(author, title, url);
    generateStories();

    $submitForm.delay(250).slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');

    $("#author").val('');
    $("#title").val('');
    $("#url").val('');

  })



  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  //MYCODE: function for populationg user profile
  function fillUserProfile() {
    $("#profile-name").text(`Name: ${localStorage.getItem("name")}`);
    $("#profile-username").text(`Username: ${localStorage.getItem("username")}`)
    $("#profile-account-date").text(`Account Created: ${localStorage.getItem("createdAt")}`)
  }
  fillUserProfile();

  //MYCODE: Check if favorites list is empty
  function favPlaceHolder() {
    if ($('#favorited-articles').children().html() === undefined) {
      $('#favorited-articles').append('<li id="fav-placeholder">No favorites added</li>')
    } else {
      $("#fav-placeholder").remove();
    }
  }

  //MYCODE: function for clicking on favorite (heart) icon. Changing style
  function favToggle(event) {
    let eventClass = event.target.classList;
    let parentClass = event.target.parentElement.classList;
    // $('event.target').remove().append('<i class="fas fa-heart"></i>');
    if (parentClass.contains('unfav')) {
      parentClass.add('fav');
      parentClass.remove('unfav');
      eventClass.add('fas');
      eventClass.remove('far');
    } else {
      
      parentClass.add('unfav');
      parentClass.remove('fav');
      eventClass.add('far');
      eventClass.remove('fas');
    };
  }

  //MYCODE: Append favorite from main page to favorites page

  async function favAppendOrRemove(event) {
    const heartSpan = event.target.parentElement;

    if (heartSpan.classList.contains('fav')) {
      const res = await StoryList.addFavorite(localStorage.username, heartSpan.parentElement.id);
    } else {
      const res = await StoryList.deleteFavorite(localStorage.username, heartSpan.parentElement.id);
    }
  };


  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    generateStories();
    $allStoriesList.slideDown(400);

    // update the navigation bar
    showNavForLoggedInUser();
    fillUserProfile();

  }



  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();

    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    let refinedFavs;
    if (currentUser) {
      const data = await StoryList.getFavoritesHelper(localStorage.username);
      const favorites = data.data.user.favorites;
      refinedFavs = favorites.map(val => val.storyId);
    }

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      if (currentUser) {
        if (refinedFavs.includes(story.storyId)) {
          result.children("span").html('<i class="fas fa-heart"></i>')
            .addClass('fav').removeClass('unfav')
        }
      };
      $allStoriesList.append(result);
    }

    //MYCODE: Adding click listener for heart icons
    if (currentUser) {
      $("i.fa-heart").on("click", async function (event) {
        favToggle(event);
        await favAppendOrRemove(event);
      });
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
      <span class="fav-heart unfav"><i class="far fa-heart"></i></span>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    hideBarLinks();
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $(".barlinks").show();
    $("#nav-welcome").show();
    $("#nav-user-profile").html(
      `|<b> &nbsp&nbsp ${localStorage.getItem("username")} &nbsp&nbsp </b>|`);
    $("#nav-user-profile").addClass('hidden').show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */
  //MYCODE: save key info into local storage

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      localStorage.setItem("createdAt", currentUser.createdAt);
      localStorage.setItem("name", currentUser.name);
    }
  }

});
