
angular.module('diary.services')

.factory('KeyRing', function() {

  var Uta = null;

  /**
   * The KeyRing class holds a user's secret keys,
   * allowing for cryptographic operations after entering
   * their passphrase once each time the app is started.
   *
   * This sensitive information is stored only in memory,
   * rather than persisted to the filesystem with other data.
   *
   * Example:
   *
   *    // Create a new key ring
   *    KeyRing.create(passphrase, salt).then(
   *      function(keyRing) {
   *        var pass          = keyRing.passphrase;
   *        var salt          = keyRing.salt;
   *        var parentKey     = keyRing.keys.parentKey;
   *        var encryptionKey = keyRing.keys.encryptionKey;
   *        var signingKey    = keyRing.keys.signingKey;
   *      }
   *    );
   *
   */
  var KeyRing = function() {};

  // Creates a new key ring from passphrase and salt.
  KeyRing.create = function(passphrase, salt) {
    var keyRing = new KeyRing();
    var promise = keyRing.configure(passphrase, salt);
    return promise;
  };

  KeyRing.prototype = {

    constructor: KeyRing,
    passphrase: null,
    salt: null,
    keys: null,

    // Configures this key ring with passphrase and salt.
    configure: function(passphrase, salt) {
      var q = $q.defer();
      var self = this;

      Crypto.deriveKeys(passphrase, salt, function(err, keys) {
        if (err) return q.reject(err);

        self.passphrase = passphrase;
        self.salt = salt;
        self.keys = keys;

        return q.resolve(self);
      });
      return q.promise;
    }
  };

  KeyRing.init = function(uta) {
    Uta = uta;
    return this;
  };

  return KeyRing;
})

.factory('Uta', function($cordovaFile, Backups, Crypto, Database, Entries, FileUtils, KeyRing, Test, Vault) {

  var Uta = {

    // The Uta Diary database.
    db: {},

    // Gets the directory for application data.
    getDataDirectory: function() {
      if (ionic.Platform.isAndroid()) {
        return cordova.file.dataDirectory;
      }
    },

    // Gets root of the directory for backups.
    getBackupRoot: function() {
      if (ionic.Platform.isAndroid()) {
        return cordova.file.externalRootDirectory;
      }
    },

    // Gets parent of the directory for backups.
    getBackupParent: function() {
      return Uta.getBackupRoot() + 'UtaDiary/';
    },

    // Gets the directory for database backups.
    getBackupDirectory: function() {
      return Uta.getBackupParent() + 'backups/';
    },

    // Lists all available backup files by name.
    listBackupFiles: function(callback) {
      var backupDir = Uta.getBackupDirectory();
      FileUtils.listDir(backupDir, function(err, entries) {
        if (err) {
          console.error("Error listing backups: ", backups);
          return callback([]);
        }
        else {
          var files = entries.map(function(entry) {return entry.name});
          return callback(files);
        }
      });
    },

    // Imports a database object.
    importDB: function(database, callback) {
      var isValid = Database.validateDB(database);
      if (isValid) {
        Uta.db = database;
        return Entries.commit(callback);
      }
      else {
        return callback(new Error("Invalid database"));
      }
    },

    // Imports a database file.
    importFile: function(path, file, callback) {
      console.log("Importing file: " + file);

      $cordovaFile.readAsText(path, file).then(
      function(success) {
        var json = success;
        var imported = angular.fromJson(json);
        console.log("Imported JSON: " + json);
        console.log("Imported object: " + JSON.stringify(imported, null, 2));

        Uta.importDB(imported, function(err) {
          if (err)
            return callback(new Error("Error importing database: " + err.message));
          else
            return callback(null);
        });
      },
      function(error) {
        return callback(new Error("Error reading file: " + JSON.stringify(error, null, 2)));
      });
    },

    // Exports database to file.
    exportFile: function(path, file, callback) {
      console.log("Exporting file: " + file);

      $cordovaFile.createDir(Uta.getBackupRoot(), 'UtaDiary', true).then(
      function(success) {
        return $cordovaFile.createDir(Uta.getBackupParent(), 'backups', true);
      },
      function(error) {
        return callback(new Error("Error creating backup directories: " + error.message));
      })
      .then(
      function(success) {
        var data = angular.toJson(Uta.db);
       return FileUtils.writeFile(path, file, data, true, callback);
      });
    },

    // Deletes a given file.
    deleteFile: function(path, file, callback) {
      console.log("Deleting file: " + file);
      $cordovaFile.removeFile(path, file).then(
        function(success) {
          return callback(null);
        },
        function(error) {
          return callback(new Error("Error deleting file: " + JSON.stringify(error)));
        }
      );
    },

    // Commits database.
    commit: function(callback) {
      return Uta.Entries.commit(callback);
    },

    // Migrates database up to latest version.
    migrateUp: function(callback) {
      var lastMigration = Uta.db.lastMigration;
      var latestMigration = Uta.Database.migrations.slice(-1)[0];

      console.log("Current database version: " + lastMigration.version);

      if (lastMigration.id < latestMigration.id) {
        console.log("Upgrading database to version: " + latestMigration.version);
        Uta.Database.migrateUp(Uta.db, latestMigration.id);
        return Uta.commit(callback);
      }
      else {
        console.log("Database is up-to-date");
        return callback(null);
      }
    }
  };

  Uta.Backups = Backups.init(Uta);
  Uta.Crypto = Crypto.init(Uta);
  Uta.Entries = Entries.init(Uta);
  Uta.Database = Database.init(Uta);
  Uta.KeyRing = KeyRing.init(Uta);
  Uta.Test = Test.init(Uta);
  Uta.Vault = Vault.init(Uta);

  window.Uta = Uta;
  return Uta;
});
