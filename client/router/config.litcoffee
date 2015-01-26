# Iron-router configuration

    Router.configure
      layoutTemplate: 'layout'
      #loadingTemplate: 'loading'

## Filters

    filters =
      isLoggedIn: ->
        Router.go 'home' unless Meteor.loggingIn() or Meteor.user()

Public routes

    Router.onBeforeAction filters.isLoggedIn,
      except: [ 'home' ]
