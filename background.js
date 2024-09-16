var prev_rating = 0;
var prev_rank = "";
var mppnotify = new Map();
var mppalert = new Map();
// Function to fetch new rating from the server
async function fetchNewRatingFromServer() {
  try {
    chrome.storage.sync.get(["codeforceshandle"], function (result) {
      const handle = result.codeforceshandle;
      if (handle) {
        fetch("https://cf-reminder-server.onrender.com/newrating", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handle: handle }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.rating && data.maxRating && data.rank && data.maxRank) {
              var rating = parseInt(data.rating);
              var maxRating = parseInt(data.maxRating);
              var rank = data.rank;
              var maxRank = data.maxRank;

              if (rank !== prev_rank) {
                var difference = rating - prev_rating;
                if (difference > 0) {
                  var notificationOptions = {
                    type: "basic",
                    iconUrl: "images/cf_reminder_16.png",
                    title: `Congratulations! You are now a ${rank}`,
                    message: `Your new rating is ${rating}`,
                  };
                  chrome.notifications.create(
                    "ratingUpdate",
                    notificationOptions
                  );
                } else {
                  if (difference < 0) {
                    difference = difference * -1;
                    var notificationOptions = {
                      type: "basic",
                      iconUrl: "images/cf_reminder_16.png",
                      title: `Oops! You are now a ${rank}`,
                      message: `Your new rating is ${rating}`,
                    };
                    chrome.notifications.create(
                      "ratingUpdate",
                      notificationOptions
                    );
                  }
                }
                prev_rating = rating;
                prev_rank = rank;
              } else {
                if (rating !== prev_rating) {
                  var difference = rating - prev_rating;

                  if (difference > 0) {
                    var notificationOptions = {
                      type: "basic",
                      iconUrl: "images/cf_reminder_16.png",
                      title: `Congratulations! Your rating has increased by ${difference}`,
                      message: `Your new rating is ${rating}`,
                    };
                    chrome.notifications.create(
                      "ratingUpdate",
                      notificationOptions
                    );
                  } else {
                    if (difference < 0) {
                      difference = difference * -1;
                      var notificationOptions = {
                        type: "basic",
                        iconUrl: "images/cf_reminder_16.png",
                        title: `Oops! Your rating has decreased by ${difference}`,
                        message: `Your new rating is ${rating}`,
                      };
                      chrome.notifications.create(
                        "ratingUpdate",
                        notificationOptions
                      );
                    }
                  }
                }
                prev_rating = rating;
                prev_rank = rank;
              }
            } else {
              console.warn("No message received from server.");
            }
          })
          .catch((error) =>
            console.error("Error sending data to server:", error)
          );
      } else {
        console.error("No Codeforces handle found in storage");
      }
    });
  } catch (error) {
    console.error("Error fetching rating from server:", error);
  }
}
// Function to fetch new contest details from the server
async function fetchNewContestDetailsFromServer() {
  try {
    const response = await fetch(
      "https://cf-reminder-server.onrender.com/newcontestdetails",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (
      data.contestInfo.day &&
      data.contestInfo.month &&
      data.contestInfo.year &&
      data.contestInfo.hours &&
      data.contestInfo.minutes &&
      data.contestInfo.ampm &&
      data.contestInfo.contestName
    ) {
      let contest = {};
      contest.day = parseInt(data.contestInfo.day);
      contest.month = parseInt(data.contestInfo.month);
      contest.year = parseInt(data.contestInfo.year);
      contest.hours = parseInt(data.contestInfo.hours);
      contest.minutes = parseInt(data.contestInfo.minutes);
      contest.ampm = data.contestInfo.ampm;
      contest.contestName = data.contestInfo.contestName;

      let today = currentTime(); // Get current time

      let currentDateTime = new Date(
        today.year,
        today.month - 1,
        today.day,
        today.hours,
        today.minutes,
        0,
        0
      );
      let contestDateTime = new Date(
        contest.year,
        contest.month - 1,
        contest.day,
        contest.hours,
        contest.minutes,
        0,
        0
      );
      let difference = contestDateTime - currentDateTime;
      difference = difference / (1000 * 60 * 60);
      difference = Math.floor(difference);

      notifyUser(difference, contest); // Call notifyUser with the calculated difference
      alertUser(difference, contest); // Call alertUser with the calculated difference
    } else {
      console.warn("No message received from server.");
    }
  } catch (error) {
    console.error("Error fetching data from server:", error);
  }
}
// Function to scrape codeforces handle from a web page
async function scrapeCodeforcesHandle() {
  chrome.tabs.create(
    { url: "https://codeforces.com/contests", active: false },
    function (tab) {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === tab.id && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: () => {
                const profilehandle = document.querySelector(
                  "#header > div.lang-chooser > div:nth-child(2) > a:nth-child(1)"
                );
                return profilehandle ? profilehandle.textContent : null;
              },
            },
            (results) => {
              if (results && results[0]) {
                const handle = results[0].result;
                chrome.storage.sync.set({ codeforceshandle: handle });
              }
              chrome.tabs.remove(tab.id);
            }
          );
        }
      });
    }
  );
}
// Function to alert the user about the contest
function alertUser(difference, contest) {
  try {
    if (difference <= 2 && mppalert[contest] === undefined) {
      mppalert[contest] = true;
      var notificationOptions = {
        type: "basic",
        iconUrl: "images/cf_reminder_16.png",
        title: `Contest Alert!`,
        message: `Contest is about to start in ${difference} hours`,
      };
      chrome.notifications.create("contestUpdate", notificationOptions);
    }
  } catch (error) {
    console.error("Error fetching rating from server:", error);
  }
}
// Function to notify the user about the contest
function notifyUser(difference, contest) {
  try {
    // console.log(mppnotify[contest]);
    if (difference <= 24 && mppnotify[contest] === undefined) {
      mppnotify[contest] = true;
      // console.log(mppnotify[contest]);
      var notificationOptions = {
        type: "basic",
        iconUrl: "images/cf_reminder_16.png",
        title: `Contest Reminder!`,
        message: `Contest is about to start in ${difference} hours`,
      };
      chrome.notifications.create("contestUpdate", notificationOptions);
    }
  } catch (error) {
    console.error("Error fetching rating from server:", error);
  }
}
// Function to get current time
function currentTime() {
  const now = new Date();

  const dateOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  };

  const timeOptions = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };

  var dateString = now.toLocaleDateString("en-IN", dateOptions);
  var timeString = now.toLocaleTimeString("en-IN", timeOptions);

  var [dayoftoday, monthoftoday, yearoftoday] = dateString.split("/");
  var [timeoftoday, ampmoftoday] = timeString.split(" ");
  var [houroftoday, minuteoftoday, secondoftoday] = timeoftoday.split(":");

  dayoftoday = parseInt(dayoftoday);
  monthoftoday = parseInt(monthoftoday);
  yearoftoday = parseInt(yearoftoday);
  houroftoday = parseInt(houroftoday);
  minuteoftoday = parseInt(minuteoftoday);
  secondoftoday = parseInt(secondoftoday);

  if (ampmoftoday === "pm") {
    ampmoftoday = "PM";
  } else {
    ampmoftoday = "AM";
  }

  var today = {};
  today.day = dayoftoday;
  today.month = monthoftoday;
  today.year = yearoftoday;
  today.hours = houroftoday;
  today.minutes = minuteoftoday;
  today.ampm = ampmoftoday;
  return today;
}
// Set an alarm to fetch new rating every 30 minutes
chrome.alarms.create("fetchNewRatingFromServer", { periodInMinutes: 2 });
// Set an alarm to fetch new contest details every one hour
chrome.alarms.create("fetchNewContestDetailsFromServer", {
  periodInMinutes: 2,
});
// // Add a listener for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchNewRatingFromServer") {
    fetchNewRatingFromServer();
  }
});
// // Add a listener for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "fetchNewContestDetailsFromServer") {
    fetchNewContestDetailsFromServer();
  }
});
// Event listener for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
  scrapeCodeforcesHandle();
  fetchNewContestDetailsFromServer();
  fetchNewRatingFromServer();
});
// Event listener for Chrome startup
chrome.runtime.onStartup.addListener(() => {
  scrapeCodeforcesHandle();
  fetchNewContestDetailsFromServer();
  fetchNewRatingFromServer();
});
