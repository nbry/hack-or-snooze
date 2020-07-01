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

  //STARTERCODE: event listener for login:
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

  //STARTERCODE: event listener for creating account
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

  //MYCODE: log out functionality:
  // 1. Clear Local Storage
  // 2. Slide up animation for all content
  // 3. After 1.5 seconds, refresh the page
  $navLogOut.on("click", async function () {
    localStorage.clear();
    hideBarLinks();
    setTimeout(location.reload.bind(window.location), 1500);
  });


  //MY CODE: login/createUser button sliding animations
  $navLogin.on("click", function () {
    if ($navLogin.hasClass('hidden1')) {
      $allStoriesList.slideUp(250);
      $loginForm.delay(250).slideDown(350);
      $createAccountForm.delay(250).slideDown(450);
      $navLogin.removeClass('hidden1');
    } else {
      $loginForm.slideUp(250);
      $createAccountForm.slideUp(250);
      $allStoriesList.delay(250).slideDown(450);
      $navLogin.addClass('hidden1');
    }
  });

  //MYCODE: Functionality for bar link toggles.
  //1. Hides all content by sliding up animation
  //2. Adds class of "hidden" to all buttons. 
  //3. Buttons are not actually hidden due to css ordering
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

  //MYCODE: clicking submit on new story:
  //1. Dims the page
  //2. Slides down new story submit window
  $("#new-story").on("click", function () {
    if ($('#new-story').hasClass('hidden')) {
      $submitForm.slideDown(150);
      $('#new-story').toggleClass('hidden');
      $('#dimmer').addClass('body-shadow')
    }
  })

  //MYCODE: function for close window button on new story window
  $("#close-window").on("click", function () {
    $submitForm.slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');
  })

  //MYCODE: adds event listener for dimmer div, which takes up whole page:
  //It closes the the new story window as well.
  $("#dimmer").on("click", function () {
    $submitForm.slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');
  })

  //MYCODE:clicking on favorites tab
  $("#favorites").on("click", async function () {

    //Prevents clicking on it again.
    if (!$('#favorites').hasClass('hidden')) {
      return;
    }

    //Populates a list saved on user data using api helper function
    $('#favorited-articles').html('');
    const user = await StoryList.generalHelper(localStorage.username);
    const favorites = user.data.user.favorites;

    for (let story of favorites) {
      const result = generateStoryHTML(story);
      result.children("span").html('<i class="fas fa-heart"></i>')
        .addClass('fav').removeClass('unfav');
      $('#favorited-articles').append(result);
    }

    //Appended heart allows user to toggle favorites from favorites window
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

  //MYCODE: Click on my stories tab. Similar function to favorited articles
  //tab. Lots of repeated code. Long function. Room for improvement
  $("#my-stories").on("click", async function () {
    if (!$('#my-stories').hasClass('hidden')) {
      return;
    }

    $('#my-articles').html('');

    const user = await StoryList.generalHelper(localStorage.username);
    const myStories = user.data.user.stories;

    for (let story of myStories) {
      const result = generateStoryHTML(story);
      result.children("span").html('<i class="fas fa-trash"></i>');
      result.children("span").removeClass('unfav');
      $('#my-articles').append(result);
    }

    //Deleting story is not a toggle. Slide Up animation after deleting
    $("i.fa-trash").on("click", async function (event) {
      const li = event.currentTarget.parentElement.parentElement;
      $(`#${li.id}`).slideUp(100);
      const res = await StoryList.deleteStory(li.id);
      myStoriesPlaceHolder();
    });

    if ($("#my-stories").hasClass('hidden')) {
      hideBarLinks();
      $ownStories.delay(350).slideDown(500);
      $("#my-stories").toggleClass('hidden');
    }
    myStoriesPlaceHolder();
  })

  //MYCODE: clicking on username shows user profile infomration
  $("#nav-user-profile").on("click", function () {
    if ($('#nav-user-profile').hasClass('hidden')) {
      hideBarLinks();
      $("#user-profile").delay(350).slideDown(500);
      $("#nav-user-profile").removeClass('hidden');
    } else {
      return;
    }
  })

  //MYCODE: clicking on home page icon populates page with stories
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

    //Slide up after submitting. Remove page dimmer
    $submitForm.delay(250).slideUp(150);
    $('#new-story').toggleClass('hidden');
    $('#dimmer').removeClass('body-shadow');

    $("#author").val('');
    $("#title").val('');
    $("#url").val('');

    //Specific language for if user submits a story while the my-stories
    //tab is open. Appends new story to My Stories page. Repeated code.
    //Room for improvement
    if (!$('#my-stories').hasClass('hidden')) {
      $('#my-articles').html('');

      const user = await StoryList.generalHelper(localStorage.username);
      const myStories = user.data.user.stories;

      for (let story of myStories) {
        const result = generateStoryHTML(story);
        result.children("span").html('<i class="fas fa-trash"></i>');
        result.children("span").removeClass('unfav');
        $('#my-articles').append(result);
      }

      $("i.fa-trash").on("click", async function (event) {
        const li = event.currentTarget.parentElement.parentElement;
        $(`#${li.id}`).slideUp(100);
        const res = await StoryList.deleteStory(li.id);
        myStoriesPlaceHolder();
      });

      if ($("#my-stories").hasClass('hidden')) {
        hideBarLinks();
        $ownStories.delay(350).slideDown(500);
        $("#my-stories").toggleClass('hidden');
      }
      myStoriesPlaceHolder();

    }

  })

  //STARTER CODE: On page load, checks local storage to see if the user is already
  //logged in. REnder page information accordingly.
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

  //MYCODE: function for populationg user profile. Gets from Local Storage
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

  //MYCODE: Check if my stories list is empty. Mostly repeated code from above.
  //Room for improvement
  function myStoriesPlaceHolder() {
    if ($('#my-articles').children().html() === undefined) {
      $('#my-articles').append('<li id="mine-placeholder">No articles submitted</li>')
    } else {
      $("#mine-placeholder").remove();
    }
  }

  //MYCODE: function for clicking on favorite (heart) icon. Changing style and 
  //toggling classes. Room for improvement: use class toggle
  function favToggle(event) {
    let eventClass = event.target.classList;
    let parentClass = event.target.parentElement.classList;
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

  //MYCODE: Calling static functions... http requests for adding and removing favorites
  async function favAppendOrRemove(event) {
    const heartSpan = event.target.parentElement;

    if (heartSpan.classList.contains('fav')) {
      const res = await StoryList.addFavorite(localStorage.username, heartSpan.parentElement.id);
    } else {
      const res = await StoryList.deleteFavorite(localStorage.username, heartSpan.parentElement.id);
    }
  };

  //STARTER CODE: a rendering function to run to reset the forms and hide the login info
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

  //A rendering function to call the StoryList.getStories static method,
  //which will generate a storyListInstance. Then render it.
  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();

    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    //MYCODE:functionality for reflecting user's favorites
    let refinedFavs;
    if (currentUser) {
      const data = await StoryList.generalHelper(localStorage.username);
      const favorites = data.data.user.favorites;
      refinedFavs = favorites.map(val => val.storyId);
    }

    //MYCODE: loop through all of our stories and generate HTML for them
    //Only performs if user is logged in
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

  //MYCODE: Generating HTML for a story. If user is logged in, this code
  //will appened a clickable heart, representating favorites
  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let storyMarkup;

    //If user is logged in, add heart
    if (currentUser) {
      storyMarkup = $(`
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
    }
    //if user is logged out, do not add heart
    else {
      storyMarkup = $(`
      <li id="${story.storyId}">
        &emsp; &nbsp;
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);
    }

    return storyMarkup;
  }

  //STARTERCODE: hide all elements in elementsArr... might be obsolete.
  //Room for improvement.
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

  //Showing navigation bar for logged in user
  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $(".barlinks").show();
    $("#nav-welcome").show();
    $("#nav-user-profile").html(
      `|<b> &nbsp&nbsp ${localStorage.getItem("username")} &nbsp&nbsp </b>|`);
    $("#nav-user-profile").addClass('hidden').show();
  }

  //STARTERCODE: simple function to pull the hostname from a URL */
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

  //STARTERCODE: sync current user information to localStorage 
  //MYCODE: added some other information
  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      localStorage.setItem("createdAt", currentUser.createdAt);
      localStorage.setItem("name", currentUser.name);
    }
  }
});
