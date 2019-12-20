# ff4j-feature-toggling

Implementation of feature toggling with FF4J library

# Configure and install FF4J in Backend

## Install required librairies

Add the following lines in the dependencies of your build.gradle :

```gradle
    compile 'org.ff4j:ff4j-spring-boot-starter:1.8'
    compile 'org.ff4j:ff4j-web:1.8'
    compile 'org.ff4j:ff4j-security-spring:1.8'
    compile 'org.thymeleaf:thymeleaf:2.1.4.RELEASE'
```

## Create ff4j and configure bean

This configuration create the FF4J Bean with authorization manager and feature store.

**FF4JConfiguration.java**

```java
...

@Configuration
public class FF4JConfiguration {

    @Autowired
    DataSource dataSource;

    @Autowired
    AuthorizationsManager authorizationsManager;

    @Bean
    public SpringSecurityAuthorisationManager getAuthorizationsManager() {
        return new SpringSecurityAuthorisationManager();
    }

    @Bean
    @DependsOn("liquibase")
    public FF4j getFF4j() {
        FF4j ff4j = new FF4j();
        ff4j.setFeatureStore(new JdbcFeatureStore(dataSource));
        ff4j.setPropertiesStore(new JdbcPropertyStore(dataSource));
        ff4j.setEventRepository(new JdbcEventRepository(dataSource));

        syncDatabaseWithXmlFeatures(ff4j);

        ff4j.setAuthorizationsManager(authorizationsManager);
        ff4j.audit(true);
        return ff4j;
    }

    public void syncDatabaseWithXmlFeatures(FF4j ff4j) {
        XmlConfig xmlConfig = ff4j.parseXmlConfig("ff4j-features.xml");
        Map<String, Feature> xmlFeatures = xmlConfig.getFeatures();
        // Remove every feature removed from xml files
        ff4j.getFeatures().values()
            .stream()
            .filter(feature -> !xmlFeatures.containsKey(feature.getUid()))
            .forEach(feature -> ff4j.delete(feature.getUid()));

        // Add every feature added in xml files
        List<Feature> featuresToAdd = xmlFeatures
            .values()
            .stream()
            .filter(feature -> !ff4j.exist(feature.getUid()))
            .collect(Collectors.toList());
        ff4j.getFeatureStore().importFeatures(featuresToAdd);
    }
}
```

The following lines enable to associate the ff4j store with your application database, FF4J will now try to stored its data in the same database as your other data :

```java
ff4j.setFeatureStore(new JdbcFeatureStore(dataSource));
ff4j.setPropertiesStore(new JdbcPropertyStore(dataSource));
ff4j.setEventRepository(new JdbcEventRepository(dataSource));
```

The following lines allow FF4J to use Spring Security user and roles.

```java
...
@Bean
public SpringSecurityAuthorisationManager getAuthorizationsManager() {
    return new SpringSecurityAuthorisationManager();
}
...
ff4j.setAuthorizationsManager(authorizationsManager);
...
```

## Create the migrations

You now need to add the migration in the _create_feature_flipping_ff4j_tables.sql_ file to create the FF4J tables in your database.

## Create and configure ff4j console

This config instantiate a servlet and expose it at the path '/ff4j-web-console/'.

**FF4JWebConfiguration.java**

```java
...

@Configuration
@ConditionalOnClass({ConsoleServlet.class, FF4jDispatcherServlet.class})
@AutoConfigureAfter(FF4JConfiguration.class)
public class FF4JWebConfiguration extends SpringBootServletInitializer {

    @Bean
    public ServletRegistrationBean servletRegistrationBean(ConsoleServlet ff4jConsoleServlet) {
        return new ServletRegistrationBean(ff4jConsoleServlet, "/ff4j-console");
    }

    @Bean
    @ConditionalOnMissingBean
    public ConsoleServlet getFF4jServlet(FF4j ff4j) {
        ConsoleServlet ff4jConsoleServlet = new ConsoleServlet();
        ff4jConsoleServlet.setFf4j(ff4j);
        return ff4jConsoleServlet;
    }

    @Bean
    public ServletRegistrationBean ff4jDispatcherServletRegistrationBean(FF4jDispatcherServlet ff4jDispatcherServlet) {
        return new ServletRegistrationBean(ff4jDispatcherServlet, "/ff4j-web-console/*");
    }

    @Bean
    @ConditionalOnMissingBean
    public FF4jDispatcherServlet getFF4jDispatcherServlet(FF4j ff4j) {
        FF4jDispatcherServlet ff4jConsoleServlet = new FF4jDispatcherServlet();
        ff4jConsoleServlet.setFf4j(ff4j);
        return ff4jConsoleServlet;
    }
}
```

You need to configure security on this path so that people won't be able to modify the features without being authenticated.
In this example we used BasicAuth on our app to protect the acccess to ff4j console.

**FF4JSecurityConfig.java**

```java
...

@Configuration
@EnableWebSecurity
@Order(1)
public class FF4jSecurityConfig extends WebSecurityConfigurerAdapter {

    @Autowired
    FF4JConsoleConfig ff4JConsoleConfig;

    @SuppressWarnings("rawtypes")
    @Override
    protected void configure(AuthenticationManagerBuilder auth)
        throws Exception {
        UserDetailsManagerConfigurer config =  auth.inMemoryAuthentication();
        UserDetailsBuilder udb = config.withUser(ff4JConsoleConfig.getUsername())
            .password("{noop}" + ff4JConsoleConfig.getPassword())
            .roles("ADMIN");
    }

    protected void configure(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.NEVER);
        http
            .antMatcher("/ff4j-web-console/**")
            .authorizeRequests()
            .anyRequest().hasRole("ADMIN")
            .and().httpBasic();
    }
}
```

## Expose the features ressource

In the React app we need to show different components according to wether or not the user can access a feature.
In order to do this we need to make an API route to get which features are allowed for a given user.

Create the folowing ressource :

**FeatureFlippingResource.java**

```java
...

@Log
@RestController
@RequestMapping("feature-toggles")
public class FeatureFlippingResource {

    @Autowired
    FeatureFlippingService featureFlippingService;

    @GetMapping("/activated")
    public ResponseEntity findActivatedUserFeatures() {
        return ResponseEntity.ok(featureFlippingService.getAllActivatedFeatureForUser());
    }
}
```

And the following service :

**FeatureFlippingService**

```java
...

@Service
public class FeatureFlippingService {
    @Autowired
    FF4j ff4j;

    public List<String> getAllActivatedFeatureForUser() {
        return ff4j.getFeatures().entrySet().stream()
            .filter(feature -> ff4j.check(feature.getKey()))
            .map(feature -> feature.getKey())
            .collect(Collectors.toList());
    }
}
```

Once the Backend is configured and the API path created we have to create the redux logic in the Frontend to get the list of activatd features and store it.

# Configure Feature flipping in FrontEnd

## Getting the list of activated feature

You need to create a redux saga to get the list of activate features by making a call to the API path we just created in the Backend.

Then make a redux cycle to save this list in the store.

Call this new saga in your login saga so that the new features are saved in the store when a user log in the app.

You can use the example of Redux logic in the ActivatedFeature direectory of this repository.

## Activating components

We need to create a container to wrap the components associated with the feature we want to toggle.
This container will show the NewComponent given in the props if the feature name is present in the store activated features list. On the other case it will display the OldComponent.

**FeatureFlipper.js**

```javascript
import * as React from "react";
import { connect } from "react-redux";
import { List } from "immutable";

type Props = {
  OldComponent: any,
  Component: any,
  featureName: string,
  activatedFeatures: List<string>
};

class FeatureFlipper extends React.Component<Props> {
  isFeatureFlipped = (activatedFeatures, featureName) =>
    activatedFeatures.includes(featureName);

  getFallbackComponent = (OldComponent, otherProps) =>
    OldComponent ? <OldComponent {...otherProps} /> : <React.Fragment />;

  render() {
    const {
      activatedFeatures,
      featureName,
      OldComponent,
      Component,
      ...otherProps
    } = this.props;
    return (
      <React.Fragment>
        {this.isFeatureFlipped(activatedFeatures, featureName) ? (
          <Component {...otherProps} />
        ) : (
          this.getFallbackComponent(OldComponent, otherProps)
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  activatedFeatures: state.activatedFeature.get("activatedFeatures")
});

const ConnectedFeatureFlipper = connect(mapStateToProps)(FeatureFlipper);

export default ConnectedFeatureFlipper;
```

# Development practices

## Checking the feature activation

We wish to display a different version of the component in the Front thanks to feature toggling.
You can use the container FeatureFlipper to show the new version or the old version of a component based on whether or not the feature is activated.
You can also choose not to display any component if the feature is not activated (that's why the props OldComponent is optionnal).

```javascript
<FeatureFlipper
  Component={Component}
  OldComponent={OldComponent}
  featureName={features.yourFeaturesName}
/>
```

**Note :** To not use your feature names as string in your logic, create a JS file with an object containing all the features name.

## Creating the features automatically

You want to have the same features declared in all our environments (staging, pre-prod, prod). We decided to declare our features just once in an xml file. Then we configured FF4J to parse this xml file and to synchronise the features in database with the features in the xml file.

```java
XmlConfig xmlConfig = ff4j.parseXmlConfig("ff4j-features.xml");
Map<String, Feature> xmlFeatures = xmlConfig.getFeatures();
// Remove every feature removed from xml files
ff4j.getFeatures().values()
    .stream()
    .filter(feature -> !xmlFeatures.containsKey(feature.getUid()))
    .forEach(feature -> ff4j.delete(feature.getUid()));

// Add every feature added in xml files
List<Feature> featuresToAdd = xmlFeatures
    .values()
    .stream()
    .filter(feature -> !ff4j.exist(feature.getUid()))
    .collect(Collectors.toList());
ff4j.getFeatureStore().importFeatures(featuresToAdd);
```

## Developping with feature flipping

When creating an app with feature toggling, tyou sometimes want to have two version of the same feature available in your app.
You need then to have the two versions of the code in your sources and to make sure they are completely independant with each other.

You should not erased the code of the former component or API routes but duplicate it entirely in the new component and API routes.

Once the new version is fully used by all your users, you have to clean the code and delete the old component and old routes entirely.
