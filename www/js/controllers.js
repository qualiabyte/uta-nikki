angular.module('nikki.controllers', [])

.controller('DashCtrl', function($scope, Entries, db) {
  $scope.stats = Entries.getStats();
})

.controller('EntriesCtrl', function($scope, Entries, db) {
  $scope.entries = Entries.all();
  $scope.create = function() {
    var options = {
      date: new Date(),
      title: "Title"
    };
    var entry = Entries.create(options);
    Entries.commit();
  };
  $scope.remove = function(chat) {
    Entries.remove(chat);
    Entries.commit();
  };
  $scope.$watch('Entries.all()', function() {
      $scope.entries = Entries.all();
    }
  );
})

.controller('EntryDetailCtrl', function($scope, $stateParams, Entries) {
  $scope.Entries = Entries;
  $scope.entry = Entries.get($stateParams.entryId);
})

.controller('ChatsCtrl', function($scope, Chats) {
  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
