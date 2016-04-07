angular.module('nikki.directives', [])

.directive('nikkiEntry', [function() {
  return {
    templateUrl: 'templates/nikki-entry.html',
    restrict: 'AE',
    scope: {
      entry: '='
    },
    link: function($scope, $element, $attrs) {
      $scope.state = {
        editingText: false,
        editingTitle: false,
        originalText: $scope.entry.text
      };
    }
  };
}])

.directive('nikkiEntryTitle', ['Entries', function(Entries) {
  return {
    templateUrl: 'templates/nikki-entry-title.html',
    restrict: 'AE',
    scope: {
      state: '=',
      entry: '='
    },
    link: function($scope, $element, $attrs) {
      $scope.startTitleEditor = function() {
        $scope.state.editingTitle = true;
        $scope.originalTitle = $scope.entry.title;
      };
      $scope.saveTitleChanges = function() {
        $scope.state.editingTitle = false;
        Entries.commit();
      };
    }
  };
}])

.directive('nikkiEntryText', function(Entries, $timeout, $window, $cordovaInAppBrowser) {
  return {
    templateUrl: 'templates/nikki-entry-text.html',
    restrict: 'AE',
    scope: {
      state: '=',
      entry: '='
    },
    link: function($scope, $element, $attrs) {
      var textarea = $element.find('form').find('textarea')[0];
      var lastSavedAt = new Date();
      var lastChangedAt = new Date();
      $scope.history = [ $scope.state.originalText ];
      $scope.checkpoint = 1;
      $scope.notifications = [];

      $scope.renderMarkdown = function(text) {
        var converter = new showdown.Converter();
        var html = converter.makeHtml(text);
        return html;
      };
      $scope.startEditor = function($event) {
        // Open links in new window
        if ($event.target.tagName == "A") {
          $window.open($event.target.href, '_system', 'location=yes');
          $event.preventDefault();
          return false;
        }

        // Show the editor
        $scope.state.editingText = true;
        $scope.state.originalText = $scope.entry.text;

        // Focus the textarea
        $timeout(function() {
          textarea.focus();
        }, 200);
      };
      $scope.textChanged = function() {
        lastChangedAt = new Date();
        $timeout(function() {
          if (Date.now() - lastChangedAt >= 3500) {
            $scope.autosave();
          }
        }, 3500);
      };
      $scope.autosave = function() {
        Entries.commit(function() {
          $scope.saveCheckpoint();
          $scope.notify("Journal saved.");
        });
      };
      $scope.saveCheckpoint = function() {
        $scope.history.splice($scope.checkpoint);
        $scope.history.push($scope.entry.text);
        $scope.checkpoint++;
      };
      $scope.notify = function(message) {
        var notice = {
          message: message,
          start: true
        };
        $scope.notifications.push(notice);
        $timeout(function() { notice.fadeIn = true });
        $timeout(function() { notice.fadeOut = true }, 2000);
        console.log(message);
      };
      $scope.preview = function() {
        $scope.state.editingText = false;
        $scope.autosave();
      };
    }
  };
});
