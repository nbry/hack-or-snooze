$(async function () {

  // cache some selectors we'll be using quite a bit
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
    $('#dimmer').removeClass('body-shadow')
  })

  $("#dimmer").on("click", function () {
    $submitForm.slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow')
  })

  //click on "favorites"
  $("#favorites").on("click", function () {
    if ($("#favorites").hasClass('hidden')) {
      hideBarLinks();
      $("#favorited-articles").delay(350).slideDown(500);
      $("#favorites").toggleClass('hidden');
    }
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
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();

    //MYCODE: Clear username from the nav
    $('#username-nav').val('').toggleClass('hidden');
    // refresh the page, clearing memory
    location.reload();
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

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    if ($("#nav-all").hasClass('hidden')) {
      hideElements();
      $allStoriesList.delay(250).slideDown(500)
      $("#nav-all").removeClass('hidden');
    }
    await generateStories();
    ;
  });

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
    $allStoriesList.slideDown(400);

    // update the navigation bar
    showNavForLoggedInUser();
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

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
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

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
