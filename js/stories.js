"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */
function generateStoryMarkup(story, showDeleteBtn = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  //Returns true if there is a user logged in, false if no user
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showDeleteBtn ? getDeleteBtnHTML() : ""}
        ${showStar ? toggleStar(story, currentUser) : ''}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}


function toggleStar(story, user){
  const isFavorite = user.isFavorite(story);
  const star = isFavorite ? 'fa-solid' : 'fa-regular';
  return `
    <span class = "star">
      <i class = "${star} fa-star"></i>
    </span>`;
}
function getDeleteBtnHTML() {
  return `
      <span class="trash-can">
        <i class="fa-solid fa-trash"></i>
      </span>`;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();
  $allFavoritesList.hide();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function putUserStoriesOnPage(){
  $allStoriesList.hide();
  $ownStories.empty();

  if(currentUser.ownStories.length === 0){
    const div = document.createElement('div');
    div.innerHTML = 'No Stories to Show!'

    $ownStories.append(div);
  } else{
    for (let story of currentUser.ownStories){
      let $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }

  $ownStories.show();
}
$navUserStories.on('click', putUserStoriesOnPage);
async function deleteStory(evt) {

  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  // re-generate story list
  await putUserStoriesOnPage();
}
$ownStories.on("click", ".trash-can", deleteStory);

//Puts currentUsers favorites stories on page when favorites nav link is clicked
function putFavoritesOnPage(){
  //Hides and empties allStoriesList
  $allStoriesList.hide();
  $allFavoritesList.empty();

  //Checks if currentUser has any favorites
  if(currentUser.favorites.length === 0){
    //Appends 'No favorites' to list
    const div = document.createElement('div');
    div.innerHTML = 'No favorites!'
    $allFavoritesList.append(div)

  //Else, put currentUsers favorites on list
  } else {

    for(let favorites of currentUser.favorites){
      const $story = generateStoryMarkup(favorites)
      $allFavoritesList.append($story)
    }

  }
  $allFavoritesList.show();
}
$navFavorites.on('click', putFavoritesOnPage)


async function userStorySubmit(e){
  e.preventDefault()
  // All data from form:
  const titleInput = document.getElementById('story-title');
  const authorInput = document.getElementById('story-author');
  const urlInput = document.getElementById('story-url');

  const title = titleInput.value;
  const author = authorInput.value;
  const url = urlInput.value;
  const user = currentUser.username;

  let newStoryInfo = {
    title,
    author,
    url,
    user
  };
  //fetches story list and runs addStory method to create a new story
  let newStory = await storyList.addStory(currentUser, newStoryInfo)
  // console.log(newStory)

  // //Generates HTML for new story
  const $story = generateStoryMarkup(newStory);
  // //Adds story to beginning of list
  $allStoriesList.prepend($story);

  $submitForm.trigger('reset')
  $submitForm.hide();
}


async function toggleFavorite(e){
  const item = e.target
  const storyId = e.target.parentElement.parentElement.id
  const story = storyList.stories.find(s => s.storyId === storyId);

  if(item.classList.contains('fa-solid')){

    await currentUser.deleteFavoriteStory(story)

    item.classList.remove('fa-solid');
    item.classList.add('fa-regular');
  } else {

    await currentUser.addFavoriteStory(story)

    item.classList.remove('fa-regular');
    item.classList.add('fa-solid');
  }
}
$allStoriesList.on('click', toggleFavorite);
$submitForm.on('submit', userStorySubmit)