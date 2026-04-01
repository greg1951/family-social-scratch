import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Button,
  Tailwind,
  Img,
  Section,
  Row,
  Column,
} from '@react-email/components';

const emailTailwindConfig = {
  theme: {
    extend: {
      fontFamily: {
        app: ['Merienda', 'Roboto', 'sans-serif'],
      },
      colors: {
        brandBg: '#eff6ff',
        brandPanel: '#59CDF7',
        brandBorder: '#93c5fd',
        brandText: '#1e3a8a',
        brandButton: '#1d4ed8',
        imageBg: '#59CDF7'
      },
    },
  },
};

export const MemberSigninEmail = ({ memberName, founderName, familyName, link }
  : { memberName: string, founderName: string, familyName: string, link: string }) => (
  <Html>

    <Head />
    <Tailwind config={
      emailTailwindConfig
    }>

      <Body className='bg-brandBg py-10 text-brandText'>
        <Container className='mx-auto rounded-lg border border-brandBorder bg-brandPanel px-8 py-6'>
          <Section className='mb-4'>
            <Row>
              <Column align='left'
                valign='middle'
                style={
                  {
                    width: '120px'
                    ,
                    paddingRight: '20px'
                  }
                }>
                <Img src='https://kbgfamilysocial.com/images/emails/family-social-logo-small.png'
                  alt='Family Social'
                  width='100'
                  height='100' />
              </Column>
              <Column align='left'
                valign='middle'
                style={
                  {
                    width: '680px'
                  }
                }>
                <Text className='m-0 font-app text-base leading-6'>
                  { founderName } welcomes you to the { familyName } family, { memberName }! Here you'll find some
                  information about how to sign in and get started.
                </Text>
              </Column>
            </Row>
            <Row><br></br></Row>

          </Section>
          <Section className='mb-4'>
            <Row>
              <Column align='left'
                valign='top'
                style={
                  {
                    width: '620px'
                    ,
                    paddingRight: '20px'
                  }
                }>
                <Text className='m-0 font-app text-base leading-6'>
                  As shown in the login page below, there are three fields required to sign in to Family Social:
                  your email address, the password you created during registration,
                  and the family name you are a member of the <b>{ familyName }</b> family network.
                </Text>
                <Row><br></br></Row>
                <Text className='m-0 font-app text-base leading-6'>
                  Make note of your family name: <b>{ familyName }</b>. It must be entered exactly this way when you sign in,
                  including the capitalization. (The name shown below is just an example and is <u>not</u> your family
                  name.)
                </Text>
              </Column>
            </Row>
            <Row><br></br></Row>
            <Row>
              <Column align='left'
                valign='top'
                style={
                  {
                    width: '620px'
                    ,
                    paddingRight: '20px'
                  }
                }>
                <Img src='https://kbgfamilysocial.com/images/emails/login-email-fields.png'
                  alt='Login Email Fields'
                  width='400'
                  height='300' />
              </Column>
            </Row>
            <Row><br></br></Row>
            <Row>
              <Column align='left'
                valign='top'
                style={
                  {
                    width: '620px'
                    ,
                    paddingRight: '20px'
                  }
                }>
                <Text className='m-0 font-app text-base leading-6'>
                  If you are experiencing any issues signing in, like you lost the initial invitation email, or you forgot
                  your password,
                  there are other helpful links on the login page to assist you. You can also reach out to { founderName }
                  for help.
                </Text>
              </Column>
            </Row>
            <Row><br></br></Row>
            <Row>
              <Column align='left'
                valign='top'
                style={
                  {
                    width: '620px'
                    ,
                    paddingRight: '20px'
                  }
                }>
                <Img src='https://kbgfamilysocial.com/images/emails/login-need-help.png'
                  alt='Login Need Help'
                  width='400'
                  height='300' />
              </Column>
            </Row>
          </Section>
          <Text className='m-0 mb-4 font-app text-base leading-6'>
            After you login go to the <b>My Account</b> page and update your profile.
          </Text>
          <Text className='m-0 mb-4 text-center font-app text-base leading-6 text-brandText'>
            After you have signed in, explore the site and all the wonderful features we have to offer! We are so
            excited to have you as part of the { familyName } family on Family Social!
          </Text>
          <Row><br></br></Row>
          <Section className='mt-4 rounded-lg bg-imageBg px-4 py-6'>
            <Row>
              <Column align='center'
                valign='middle'
                style={
                  {
                    width: '180px'
                    ,
                    paddingTop: '8px'
                  }
                }>
                <Text className='m-0 text-center'>
                  <Button href="https://kbgfamilysocial.com/login"
                    className='font-app inline-block rounded-md bg-brandButton px-5 py-3 font-extrabold text-white no-underline'>
                    Family Social Login
                  </Button>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Tailwind>

  </Html>
);

export default MemberSigninEmail;
